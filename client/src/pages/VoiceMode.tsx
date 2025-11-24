import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mic,
  Volume2,
  VolumeX,
  Loader2,
  Trash2,
  Waves,
  MessageSquare,
  Wand2,
  Search,
  Code2,
} from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, Conversation, Message } from "@shared/schema";
import { format } from "date-fns";
import { WalkieTalkieButton } from "@/components/WalkieTalkieButton";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

export default function VoiceMode() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    user,
    isLoading: authLoading,
    isAuthenticated,
  } = useAuth() as {
    user: User | undefined;
    isLoading: boolean;
    isAuthenticated: boolean;
  };

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("grok-2-latest");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const streamingMessageRef = useRef("");
  const autoSpeakRef = useRef(true);
  
  const {
    speak,
    cancel: cancelSpeech,
    isSpeaking,
  } = useTextToSpeech({
    rate: 1.1,
    pitch: 1.0,
    volume: 1.0,
  });

  // Keep autoSpeakRef in sync with autoSpeak state
  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please login to continue...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: allConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
  });

  // Filter to only voice conversations - use useMemo to prevent re-filtering on every render
  const conversations = useMemo(
    () => allConversations?.filter(c => c.mode === "voice") || [],
    [allConversations]
  );

  const { data: messages } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConversationId, "messages"],
    enabled: !!selectedConversationId,
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/conversations", {
        title: "Voice Conversation",
        model: selectedModel,
        mode: "voice",
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("[Voice] Conversation created successfully:", data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversationId(data.id);
      toast({
        title: "Voice Chat Ready",
        description: "You can now start speaking",
      });
    },
    onError: (error: any) => {
      console.error("[Voice] Failed to create conversation:", error);
      hasCreatedRef.current = false; // Reset on error so user can retry
      toast({
        title: "Failed to create conversation",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await apiRequest("DELETE", `/api/conversations/${conversationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversationId(null);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  // Auto-create first conversation
  const hasCreatedRef = useRef(false);
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    if (conversations.length === 0 && !createConversationMutation.isPending && !hasCreatedRef.current) {
      console.log("[Voice] Auto-creating first conversation");
      hasCreatedRef.current = true;
      createConversationMutation.mutate();
    } else if (conversations.length > 0 && !selectedConversationId) {
      console.log("[Voice] Selecting first conversation:", conversations[0].id);
      setSelectedConversationId(conversations[0].id);
    }
  }, [isAuthenticated, conversations.length, selectedConversationId, createConversationMutation.isPending]);

  // WebSocket management
  useEffect(() => {
    if (!isAuthenticated || !selectedConversationId) {
      console.log("[Voice] Skipping WebSocket - not ready", { isAuthenticated, selectedConversationId });
      return;
    }

    console.log("[Voice] Setting up WebSocket connection...");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    let isConnected = false;

    ws.onopen = () => {
      console.log("[Voice] WebSocket connected successfully");
      isConnected = true;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[Voice] WebSocket message received:", data.type);

        if (data.type === "chunk") {
          streamingMessageRef.current += data.content;
          setStreamingMessage((prev) => prev + data.content);
        } else if (data.type === "done") {
          console.log("[Voice] Streaming complete");
          const finalMessage = streamingMessageRef.current;
          
          setIsStreaming(false);
          queryClient.invalidateQueries({
            queryKey: ["/api/conversations", selectedConversationId, "messages"],
          });
          
          if (autoSpeakRef.current && finalMessage) {
            console.log("[Voice] Auto-speaking enabled, message length:", finalMessage.length);
            console.log("[Voice] Speaking:", finalMessage.substring(0, 100));
            
            // Use a timeout to ensure state is updated before speaking
            setTimeout(() => {
              try {
                speak(finalMessage);
                console.log("[Voice] Speech initiated successfully");
              } catch (error) {
                console.error("[Voice] Failed to initiate speech:", error);
                toast({
                  title: "Speech Error",
                  description: "Could not play voice response",
                  variant: "destructive",
                });
              }
            }, 100);
          } else {
            console.log("[Voice] Not speaking:", { 
              autoSpeak: autoSpeakRef.current, 
              hasMessage: !!finalMessage,
              messageLength: finalMessage?.length 
            });
          }
          
          setStreamingMessage("");
          streamingMessageRef.current = "";
        } else if (data.type === "error") {
          console.error("[Voice] Error from server:", data.message);
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
          setIsStreaming(false);
          setStreamingMessage("");
        } else if (data.type === "connected") {
          console.log("[Voice] Connection confirmed");
        } else if (data.type === "conversationCreated") {
          console.log("[Voice] Conversation created:", data.conversationId);
        }
      } catch (error) {
        console.error("[Voice] WebSocket message parse error:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("[Voice] WebSocket error:", error);
      // Only show error toast if we were connected or trying to send a message
      if (isConnected || isStreaming) {
        toast({
          title: "Connection Error",
          description: "Voice connection lost. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    ws.onclose = (event) => {
      console.log("[Voice] WebSocket disconnected", event.code, event.reason);
      // Only show error if it was an abnormal closure and we were connected
      if (isConnected && event.code !== 1000 && event.code !== 1001) {
        toast({
          title: "Connection Closed",
          description: "Voice connection closed unexpectedly. Please refresh.",
          variant: "destructive",
        });
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        console.log("[Voice] Cleaning up WebSocket connection");
        ws.close(1000, "Component unmounting");
      }
    };
    // Note: autoSpeak and speak are intentionally NOT in dependencies to prevent reconnections
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, selectedConversationId]);

  const handleVoiceInput = async (transcript: string) => {
    if (!selectedConversationId || !wsRef.current || !transcript.trim()) {
      console.log("[Voice] Cannot send - missing requirements:", {
        hasConversation: !!selectedConversationId,
        hasWebSocket: !!wsRef.current,
        hasTranscript: !!transcript.trim(),
      });
      return;
    }

    // Check WebSocket state
    if (wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("[Voice] WebSocket not ready. State:", wsRef.current.readyState);
      toast({
        title: "Connection Not Ready",
        description: "Please wait for the connection to establish",
        variant: "destructive",
      });
      return;
    }

    console.log("[Voice] Sending message:", {
      conversationId: selectedConversationId,
      message: transcript,
      model: selectedModel,
    });

    setIsStreaming(true);
    setStreamingMessage("");
    streamingMessageRef.current = "";

    try {
      wsRef.current.send(
        JSON.stringify({
          type: "chat",
          conversationId: selectedConversationId,
          message: transcript,
          mode: "voice",
          model: selectedModel,
        })
      );
    } catch (error) {
      console.error("[Voice] Failed to send message:", error);
      setIsStreaming(false);
      toast({
        title: "Send Failed",
        description: "Could not send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNewConversation = () => {
    createConversationMutation.mutate();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mic className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Voice Mode</h1>
              <p className="text-xs text-muted-foreground">
                Talk naturally with AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[140px]" data-testid="select-voice-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grok-2-latest">Grok 2</SelectItem>
                <SelectItem value="claude-sonnet-4-20250514">Claude Sonnet</SelectItem>
                <SelectItem value="gpt-5">GPT-5</SelectItem>
                <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setAutoSpeak(!autoSpeak)}
              data-testid="button-toggle-autospeak"
            >
              {autoSpeak ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleNewConversation}
              disabled={createConversationMutation.isPending}
              data-testid="button-new-voice-conversation"
            >
              New Chat
            </Button>
          </div>
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
              data-testid="link-chat-mode"
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Chat
            </Button>
          </Link>
          <Link href="/voice">
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 hover-elevate active-elevate-2 bg-primary/10 text-primary"
              data-testid="link-voice-mode"
            >
              <Mic className="h-4 w-4 mr-1.5" />
              Voice
            </Button>
          </Link>
          <Link href="/images">
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 hover-elevate active-elevate-2"
              data-testid="link-images-mode"
            >
              <Wand2 className="h-4 w-4 mr-1.5" />
              Images
            </Button>
          </Link>
          <Link href="/search">
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 hover-elevate active-elevate-2"
              data-testid="link-search-mode"
            >
              <Search className="h-4 w-4 mr-1.5" />
              Search
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="shrink-0 opacity-50"
            data-testid="button-code-mode-soon"
          >
            <Code2 className="h-4 w-4 mr-1.5" />
            Code
            <Badge variant="outline" className="ml-1.5 text-xs">Soon</Badge>
          </Button>
        </div>
      </div>

      {/* Live Voice Interface - Minimal like ChatGPT */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Status Display */}
          <div className="space-y-4">
            {isStreaming ? (
              <>
                <div className="relative inline-flex">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                  <Avatar className="h-24 w-24 relative">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      SS
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Speaking...</h2>
                  {streamingMessage && (
                    <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                      {streamingMessage}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    SS
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Ready to listen</h2>
                  <p className="text-muted-foreground text-lg">
                    Hold the button and speak
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Last Exchange (subtle) */}
          {messages && messages.length > 0 && (
            <div className="space-y-3 opacity-50 hover:opacity-100 transition-opacity">
              <p className="text-sm text-muted-foreground">Last conversation:</p>
              <div className="text-sm space-y-2 max-h-32 overflow-y-auto">
                {messages.slice(-2).map((msg) => (
                  <div key={msg.id} className="text-left">
                    <span className="font-medium">
                      {msg.role === "user" ? "You" : "AI"}:
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {msg.content.substring(0, 100)}
                      {msg.content.length > 100 ? "..." : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Voice Input - Large and Prominent */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center gap-6">
            {/* Large Voice Button */}
            <WalkieTalkieButton
              onTranscript={handleVoiceInput}
              disabled={isStreaming}
              className="h-24 w-24 text-2xl"
            />
            
            {/* Status Text */}
            <div className="text-center space-y-1">
              <p className="text-lg font-medium">
                {isStreaming ? "🎧 Listening to AI..." : "🎤 Tap to speak"}
              </p>
              <p className="text-sm text-muted-foreground">
                {autoSpeakRef.current 
                  ? "AI will respond with voice" 
                  : "AI will respond with text"}
              </p>
            </div>

            {/* Action Buttons */}
            {selectedConversationId && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    console.log("[Voice] Testing TTS...");
                    speak("This is a test of the text to speech system.");
                  }}
                >
                  <Volume2 className="h-3 w-3 mr-1" />
                  Test Voice
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteConversationMutation.mutate(selectedConversationId)}
                  disabled={deleteConversationMutation.isPending}
                  data-testid="button-delete-conversation"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear History
                </Button>
                {isSpeaking && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelSpeech}
                  >
                    <VolumeX className="h-3 w-3 mr-1" />
                    Stop Speaking
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
