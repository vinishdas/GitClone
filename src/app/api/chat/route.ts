// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateLLMResponse } from '@/app/lib/llmClient';
import { generateEmbedding } from '@/app/lib/embeddingClient';
import { getOrCreateSessionId } from '@/app/lib/session';
import { addMessage } from '@/app/lib/chatStore';
import { getRelevantMessages } from '@/app/lib/semanticSearch';
import type { ChatRequest, ChatMessage } from '@/app/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: unknown = await request.json();

    // Validate the request structure
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { message } = body as Partial<ChatRequest>;

    // Validate message field
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Create temporary response to capture session cookie logic
    const tempResponse = NextResponse.json({}, { status: 200 });
    const sessionId = getOrCreateSessionId(request, tempResponse);

    // Add the user's message to database
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
    };
    await addMessage(sessionId, userMessage);

    // Generate embedding and build context (Keep existing logic)
    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await generateEmbedding(message);
    } catch (error) {
      queryEmbedding = null;
    }

    let contextPrompt = '';
    if (queryEmbedding) {
      const relevantMessages = await getRelevantMessages(sessionId, queryEmbedding, 5);
      if (relevantMessages.length > 0) {
        contextPrompt += 'Relevant conversation context:\n\n';
        for (const msg of relevantMessages) {
          const roleLabel = msg.role === 'user' ? 'User' : 'Assistant';
          contextPrompt += `${roleLabel}: ${msg.content}\n`;
        }
        contextPrompt += '\n';
      }
    }
    contextPrompt += `Current user message:\n${message}`;

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullAssistantMessage = '';

        try {
          // Call the streaming LLM client
          const generator = generateLLMResponse(contextPrompt);

          for await (const chunk of generator) {
            fullAssistantMessage += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          // Once stream is finished, save the full message to the database
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: fullAssistantMessage,
          };
          await addMessage(sessionId, assistantMsg);

          controller.close();
        } catch (error) {
          console.error('Error during streaming:', error);
          controller.error(error);
        }
      },
    });

    // Return the stream
    const finalResponse = new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

    // Copy session cookie from temp response to final response
    const sessionCookie = tempResponse.cookies.get('gpt_session_id');
    if (sessionCookie) {
      finalResponse.cookies.set('gpt_session_id', sessionCookie.value, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
    }

    return finalResponse;

  } catch (error) {
    console.error('Internal server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}