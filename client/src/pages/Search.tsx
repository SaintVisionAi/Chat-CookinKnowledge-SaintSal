import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Search as SearchIcon, Loader2, ExternalLink, Globe, Send, ArrowLeft, Home, Menu, X, Plus, Sparkles, History, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import type { User } from "@shared/schema";
import ReactMarkdown from 'react-markdown';
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SearchMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: string[];
  timestamp: Date;
}

interface SearchHistory {
  id: string;
  query: string;
  timestamp: Date;
  messages: SearchMessage[];
}

export default function Search() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<SearchMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth() as {
    user: User | undefined;
    isAuthenticated: boolean;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleSearch = async () => {
    if (!query.trim() || isSearching) return;

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use web search",
        variant: "destructive",
      });
      return;
    }

    // Add user message
    const userMessage: SearchMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setQuery("");
    setIsSearching(true);
    setStreamingMessage("");

    try {
      // Construct WebSocket URL correctly using origin
      const wsUrl = new URL("/ws", window.location.origin);
      wsUrl.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      console.log('[Search] Connecting to WebSocket:', wsUrl.href);
      
      const ws = new WebSocket(wsUrl.href);
      let fullAnswer = "";
      let citations: string[] = [];
      let messageSent = false;

      ws.onopen = () => {
        console.log('[Search] WebSocket connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('[Search] Received:', data);

        if (data.type === "connected") {
          // Connection confirmed, now send the search query
          if (!messageSent) {
            messageSent = true;
            console.log('[Search] Sending search query:', userMessage.content);
            ws.send(JSON.stringify({
              type: "search",
              query: userMessage.content,
              conversationId: null,
            }));
          }
        } else if (data.type === "chunk") {
          fullAnswer += data.content;
          setStreamingMessage(fullAnswer);
        } else if (data.type === "done") {
          // Add assistant message with final answer
          const assistantMessage: SearchMessage = {
            id: Date.now().toString(),
            role: "assistant",
            content: fullAnswer,
            citations: citations.length > 0 ? citations : undefined,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
          setStreamingMessage("");
          setIsSearching(false);
          ws.close();
        } else if (data.type === "error") {
          toast({
            title: "Search Error",
            description: data.message,
            variant: "destructive",
          });
          setStreamingMessage("");
          setIsSearching(false);
          ws.close();
        } else if (data.searchResults?.citations) {
          citations = data.searchResults.citations;
        }
      };

      ws.onerror = (error) => {
        console.error("[Search] WebSocket error:", error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to search service",
          variant: "destructive",
        });
        setStreamingMessage("");
        setIsSearching(false);
      };

      ws.onclose = () => {
        console.log("[Search] WebSocket closed");
        if (isSearching) {
          setStreamingMessage("");
          setIsSearching(false);
        }
      };

    } catch (error) {
      console.error("[Search] Error in performSearch:", error);
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      setStreamingMessage("");
      setIsSearching(false);
    }
  };

  // Load search history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSearchHistory(parsed.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp),
          messages: h.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        })));
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    }
  }, []);

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    if (searchHistory.length > 0) {
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
  }, [searchHistory]);

  // Save current search to history when done
  useEffect(() => {
    if (!isSearching && messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      const userMessage = messages.find(m => m.role === 'user');
      if (userMessage && !currentHistoryId) {
        const newHistory: SearchHistory = {
          id: Date.now().toString(),
          query: userMessage.content,
          timestamp: new Date(),
          messages: [...messages]
        };
        setSearchHistory(prev => [newHistory, ...prev].slice(0, 50)); // Keep last 50 searches
        setCurrentHistoryId(newHistory.id);
      } else if (currentHistoryId) {
        // Update existing history
        setSearchHistory(prev => prev.map(h => 
          h.id === currentHistoryId 
            ? { ...h, messages: [...messages] }
            : h
        ));
      }
    }
  }, [isSearching, messages, currentHistoryId]);

  const handleNewSearch = () => {
    setMessages([]);
    setQuery("");
    setStreamingMessage("");
    setCurrentHistoryId(null);
  };

  const handleStopGeneration = () => {
    setIsSearching(false);
    setStreamingMessage("");
  };

  const loadHistoryItem = (history: SearchHistory) => {
    setMessages(history.messages);
    setCurrentHistoryId(history.id);
    setQuery("");
    setStreamingMessage("");
    setSidebarOpen(false); // Close sidebar on mobile after selecting
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory(prev => prev.filter(h => h.id !== id));
    if (currentHistoryId === id) {
      handleNewSearch();
    }
    toast({
      title: "Deleted",
      description: "Search history deleted",
    });
  };

  const clearAllHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
    handleNewSearch();
    toast({
      title: "Cleared",
      description: "All search history cleared",
    });
  };

  const showEmptyState = messages.length === 0;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Search History Sidebar */}
      <aside className={cn(
        "w-64 border-r border-border bg-background/95 backdrop-blur-sm flex flex-col transition-all duration-300 shrink-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:border-0"
      )}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Search History</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewSearch}
            className="h-8 w-8 p-0"
            title="New Search"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {searchHistory.length === 0 ? (
            <div className="text-center py-8 px-4 text-sm text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No search history yet</p>
            </div>
          ) : (
            searchHistory.map((history) => (
              <button
                key={history.id}
                onClick={() => loadHistoryItem(history)}
                className={cn(
                  "w-full text-left p-3 rounded-lg hover:bg-accent transition-colors group relative",
                  currentHistoryId === history.id && "bg-accent"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate mb-1">
                      {history.query}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(history.timestamp, "MMM d, h:mm a")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => deleteHistoryItem(history.id, e)}
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </button>
            ))
          )}
        </div>

        {searchHistory.length > 0 && (
          <div className="p-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllHistory}
              className="w-full text-xs"
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Clear All History
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Search Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - Always Visible */}
        <header className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 border-b border-border shrink-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            {/* Sidebar Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="shrink-0"
              title={sidebarOpen ? "Hide History" : "Show History"}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <History className="h-5 w-5" />}
            </Button>

            {/* Back to Dashboard button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/dashboard")}
              className="hidden md:flex shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search Title */}
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-sm sm:text-lg truncate">
                Web Search
              </h2>
            </div>

            {/* New Search Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewSearch}
              className="md:hidden shrink-0"
              title="New Search"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewSearch}
              className="hidden md:flex"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Search
            </Button>
          </div>
        </header>

        {/* Quick Mode Switcher */}
        <div className="border-b border-border bg-background/80 backdrop-blur-sm px-3 sm:px-6 py-2">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <Link href="/chat">
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 hover-elevate active-elevate-2"
              >
                <SearchIcon className="h-4 w-4 mr-1.5" />
                Chat
              </Button>
            </Link>
            <Link href="/voice">
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 hover-elevate active-elevate-2"
              >
                <SearchIcon className="h-4 w-4 mr-1.5" />
                Voice
              </Button>
            </Link>
            <Link href="/images">
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 hover-elevate active-elevate-2"
              >
                <SearchIcon className="h-4 w-4 mr-1.5" />
                Images
              </Button>
            </Link>
            <Link href="/search">
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 hover-elevate active-elevate-2 bg-primary/10 text-primary"
              >
                <SearchIcon className="h-4 w-4 mr-1.5" />
                Search
              </Button>
            </Link>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {showEmptyState ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center px-4 sm:px-6">
              <div className="max-w-2xl w-full text-center space-y-4 sm:space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                    <Globe className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-xl sm:text-3xl font-bold">
                    Search the Web with AI
                  </h1>
                  <p className="text-sm sm:text-base text-primary font-medium">
                    Powered by Perplexity AI
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground px-4">
                    Get accurate answers with sources from across the internet
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center px-4">
                  <Button
                    variant="outline"
                    className="rounded-full text-xs sm:text-sm"
                    size="sm"
                    onClick={() => {
                      setQuery("What's happening in AI today?");
                      setTimeout(() => handleSearch(), 100);
                    }}
                  >
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Latest AI News
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full text-xs sm:text-sm"
                    size="sm"
                    onClick={() => {
                      setQuery("Explain quantum computing");
                      setTimeout(() => handleSearch(), 100);
                    }}
                  >
                    Search Example
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
              {messages.map((message, index) => (
                <div key={message.id} className="group animate-slide-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  {message.role === "user" ? (
                    <div className="flex gap-3 sm:gap-4 items-start">
                      <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background">
                        <AvatarImage
                          src={user?.profileImageUrl || undefined}
                          alt={user?.firstName || user?.email || "User"}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {user?.firstName?.[0] || user?.email?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">You</span>
                          <span className="text-xs text-muted-foreground">
                            {format(message.timestamp, "h:mm a")}
                          </span>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap m-0">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 sm:gap-4 items-start">
                      <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                          <Sparkles className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">AI Search</span>
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            <Globe className="h-3 w-3 mr-1" />
                            Perplexity
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(message.timestamp, "h:mm a")}
                          </span>
                        </div>
                        
                        <Card className="p-4 sm:p-5 bg-muted/30 border-muted">
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-p:leading-7 prose-strong:text-foreground prose-li:text-foreground prose-code:text-foreground prose-pre:bg-background">
                            <ReactMarkdown
                              components={{
                                p: ({children}) => <p className="mb-4 last:mb-0 leading-7">{children}</p>,
                                ul: ({children}) => <ul className="mb-4 ml-6 list-disc space-y-2">{children}</ul>,
                                ol: ({children}) => <ol className="mb-4 ml-6 list-decimal space-y-2">{children}</ol>,
                                li: ({children}) => <li className="leading-7">{children}</li>,
                                h1: ({children}) => <h1 className="text-xl font-bold mb-3 mt-6 first:mt-0">{children}</h1>,
                                h2: ({children}) => <h2 className="text-lg font-semibold mb-3 mt-5 first:mt-0">{children}</h2>,
                                h3: ({children}) => <h3 className="text-base font-semibold mb-2 mt-4 first:mt-0">{children}</h3>,
                                code: ({node, inline, ...props}: any) => 
                                  inline ? 
                                    <code className="px-1.5 py-0.5 rounded bg-background border text-sm" {...props} /> : 
                                    <code className="block p-3 rounded bg-background border text-sm overflow-x-auto" {...props} />,
                                blockquote: ({children}) => <blockquote className="border-l-4 border-primary pl-4 italic my-4">{children}</blockquote>,
                                a: ({href, children}) => <a href={href} className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer">{children}</a>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </Card>

                        {/* Display citations if present */}
                        {message.citations && message.citations.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Sources ({message.citations.length})</span>
                            </div>
                            <div className="grid gap-2">
                              {message.citations.map((citation, idx) => {
                                let domain = '';
                                try {
                                  domain = new URL(citation).hostname.replace('www.', '');
                                } catch {
                                  domain = citation;
                                }
                                return (
                                  <a
                                    key={idx}
                                    href={citation}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                    data-testid={`citation-${idx}`}
                                  >
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                                      {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                        {domain}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {citation}
                                      </div>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isSearching && streamingMessage && (
                <div className="group animate-slide-in-up">
                  <div className="flex gap-3 sm:gap-4 items-start">
                    <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground animate-pulse">
                        <Sparkles className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">AI Search</span>
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 animate-pulse">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Searching
                        </Badge>
                      </div>
                      
                      <Card className="p-4 sm:p-5 bg-muted/30 border-muted">
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground prose-p:leading-7">
                          <ReactMarkdown
                            components={{
                              p: ({children}) => <p className="mb-4 last:mb-0 leading-7">{children}</p>,
                              ul: ({children}) => <ul className="mb-4 ml-6 list-disc space-y-2">{children}</ul>,
                              ol: ({children}) => <ol className="mb-4 ml-6 list-decimal space-y-2">{children}</ol>,
                              li: ({children}) => <li className="leading-7">{children}</li>,
                              code: ({node, inline, ...props}: any) => 
                                inline ? 
                                  <code className="px-1.5 py-0.5 rounded bg-background border text-sm" {...props} /> : 
                                  <code className="block p-3 rounded bg-background border text-sm" {...props} />,
                            }}
                          >
                            {streamingMessage}
                          </ReactMarkdown>
                          <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {/* Stop Generation Button */}
              {isSearching && (
                <div className="flex justify-center py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStopGeneration}
                    className="gap-2 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
                    Stop searching
                  </Button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Search Input - Bottom */}
        <div className="border-t border-border bg-background backdrop-blur-sm shrink-0 safe-bottom">
          <div className="max-w-4xl mx-auto px-2 sm:px-6 py-3 sm:py-4">
            <div className="relative bg-card rounded-2xl shadow-lg border border-border/50 backdrop-blur-sm transition-all hover:shadow-xl">
              <div className="flex items-end gap-2 p-3 sm:p-2">
                <div className="flex-1 max-h-32 overflow-y-auto">
                  <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    placeholder="Search the web with AI..."
                    className="min-h-[44px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-2 py-2"
                    disabled={isSearching}
                    data-testid="input-search"
                  />
                </div>

                {/* Search Button */}
                <Button
                  onClick={handleSearch}
                  size="icon"
                  className="h-12 w-12 sm:h-10 sm:w-10 rounded-full bg-primary hover:bg-primary/90 shrink-0 self-end transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  disabled={!query.trim() || isSearching}
                  data-testid="button-search"
                >
                  {isSearching ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Hint Text */}
            <div className="hidden sm:flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>Press Enter to search</span>
              <span>•</span>
              <span>Powered by Perplexity AI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
