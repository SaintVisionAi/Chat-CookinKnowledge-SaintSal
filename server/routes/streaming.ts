// SSE (Server-Sent Events) streaming endpoint for Vercel serverless
// This replaces WebSocket functionality for serverless environments
import type { Request, Response } from "express";
import { storage } from "../storage";
import { orchestrator } from "../providers/orchestrator";
import { getSaintSalPrompt } from "../providers/saintsal-prompt";
import { checkMessageLimit, incrementMessageCount } from "../tier-limits";

// SSE helper to send data
function sendSSE(res: Response, event: string, data: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// WebSocket-like interface for SSE (implements StreamSender)
class SSESender {
  constructor(private res: Response) {}

  send(data: string) {
    try {
      const parsed = JSON.parse(data);
      // Forward all message types to SSE
      if (parsed.type === 'chunk') {
        sendSSE(this.res, 'chunk', parsed);
      } else if (parsed.type === 'error') {
        sendSSE(this.res, 'error', parsed);
      } else if (parsed.type === 'status') {
        sendSSE(this.res, 'status', parsed);
      } else {
        sendSSE(this.res, 'message', parsed);
      }
    } catch (e) {
      // If not JSON, send as-is
      sendSSE(this.res, 'message', { type: 'raw', data });
    }
  }
}

export async function handleStreamingChat(req: Request, res: Response) {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

  const userId = (req.session as any)?.userId;
  if (!userId) {
    sendSSE(res, 'error', { 
      type: 'error', 
      message: 'Unauthorized - Please log in' 
    });
    res.end();
    return;
  }

  try {
    const { conversationId, message, model = 'gpt-4o-mini', mode = 'chat', imageData } = req.body;

    // Check message limits
    const limitCheck = await checkMessageLimit(userId);
    if (!limitCheck.allowed) {
      sendSSE(res, 'error', {
        type: 'error',
        message: `Message limit reached! You've used all ${limitCheck.limit} messages this month. Upgrade to send more messages.`,
        code: 'LIMIT_REACHED',
        tier: limitCheck.tier,
        limit: limitCheck.limit,
        remaining: 0,
      });
      res.end();
      return;
    }

    let finalConversationId = conversationId;

    // Create conversation if it doesn't exist
    if (!finalConversationId) {
      const conversation = await storage.createConversation({
        userId,
        title: message.substring(0, 100),
        model,
        mode,
      });
      finalConversationId = conversation.id;
      
      sendSSE(res, 'conversationCreated', { conversationId: finalConversationId });
    }

    // Save user message
    const messageData: any = {
      conversationId: finalConversationId,
      role: 'user',
      content: message,
    };

    if (imageData) {
      messageData.attachments = [{
        type: 'image',
        data: imageData,
        mimeType: imageData.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
      }];
    }

    await storage.createMessage(messageData);

    // Increment message count
    try {
      await incrementMessageCount(userId);
    } catch (error) {
      console.error('Failed to increment message count:', error);
    }

    // Get conversation history
    const messages = await storage.getMessagesByConversationId(finalConversationId);
    
    // Build conversation with SaintSal system prompt
    const systemPrompt = getSaintSalPrompt(mode);
    
    // Convert to orchestrator format
    const conversationHistory = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      imageData: msg.attachments?.find((a: any) => a.type === 'image')?.data,
    }));

    // Add system prompt
    const orchestratorMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ];

    // Create SSE sender
    const sseSender = new SSESender(res);

    // Process request with orchestrator
    try {
      const fullResponse = await orchestrator.processRequest(
        orchestratorMessages as any,
        sseSender as any, // Cast to WebSocket-like interface
        {
          model,
          mode,
          temperature: 0.7,
          maxTokens: 4096,
        }
      );

      // Save assistant message
      await storage.createMessage({
        conversationId: finalConversationId,
        role: 'assistant',
        content: fullResponse,
      });

      // Update conversation memory for RAG
      try {
        const { updateConversationMemory } = await import('../websocket');
        await updateConversationMemory(
          finalConversationId,
          messages,
          fullResponse
        );
      } catch (error) {
        console.error('Failed to update conversation memory:', error);
        // Non-critical, continue
      }

      // Send completion event
      sendSSE(res, 'done', {
        type: 'done',
        conversationId: finalConversationId,
        message: fullResponse,
      });

    } catch (error: any) {
      console.error('[Streaming] Error processing request:', error);
      sendSSE(res, 'error', {
        type: 'error',
        message: error.message || 'Failed to process request',
      });
    }

  } catch (error: any) {
    console.error('[Streaming] Fatal error:', error);
    sendSSE(res, 'error', {
      type: 'error',
      message: error.message || 'Internal server error',
    });
  } finally {
    res.end();
  }
}

