// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateLLMResponse } from '@/app/lib/llmClient';
import { generateEmbedding } from '@/app/lib/embeddingClient';
import { getOrCreateSessionId } from '@/app/lib/session';
import { addMessage } from '@/app/lib/chatStore';
import { getRelevantMessages } from '@/app/lib/semanticSearch';
import type { ChatRequest, ChatResponse, ChatMessage } from '@/app/lib/types';

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
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message must be a string' },
        { status: 400 }
      );
    }

    if (message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    // Create temporary response to capture session cookie
    const tempResponse = NextResponse.json({}, { status: 200 });

    // Establish or retrieve session
    const sessionId = getOrCreateSessionId(request, tempResponse);

    // Add the user's message to database
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
    };
    await addMessage(sessionId, userMessage);

    // Generate embedding for the current user message
    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await generateEmbedding(message);
    } catch (error) {
      // Continue without semantic search if embedding fails
      queryEmbedding = null;
    }

    // Build context prompt using semantic search
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

    // Call the LLM client with context
    const assistantMessage = await generateLLMResponse(contextPrompt);

    // Store the assistant reply in database
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: assistantMessage,
    };
    await addMessage(sessionId, assistantMsg);

    // Return the response with session cookie preserved
    const response: ChatResponse = {
      assistantMessage,
    };

    const finalResponse = NextResponse.json(response, { status: 200 });

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
    // Handle internal errors
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
