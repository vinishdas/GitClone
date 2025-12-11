import { NextRequest, NextResponse } from 'next/server';
import { generateLLMResponse } from '@/app/lib/llmClient';
// REMOVED: import { getOrCreateSessionId } from '@/app/lib/session'; 
import { addMessage, getRecentMessages } from '@/app/lib/chatStore';
import { verifyToken } from '@/app/lib/jwt';
import { prisma } from '@/app/lib/prisma';
import type { ChatRequest, ChatMessage } from '@/app/lib/types';
import { checkRateLimit } from '@/app/lib/rateLimitStore';

interface ChatRequestBody {
  message: string;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const { message, sessionId: requestedSessionId } = body;

    // --- RATE LIMIT CHECK ---
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    // Use IP for rate limiting if it's a new chat
    const rateLimitKey = requestedSessionId || ip;

    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: 'You are sending messages too fast. Please wait a moment.' }, 
        { status: 429 }
      );
    }
    // ------------------------

    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const tempResponse = NextResponse.json({}, { status: 200 });
    let sessionId = requestedSessionId;
    let userId: string | null = null;
    
    // Check Auth
    const authToken = request.cookies.get('auth_token')?.value;
    if (authToken) {
      const payload = verifyToken(authToken);
      if (payload) userId = payload.userId;
    }

    // [!code change] FORCE NEW SESSION LOGIC
    // If the frontend didn't send a Session ID (User clicked "New Chat"),
    // we MUST generate a fresh one. We do NOT look at the old cookie.
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    // Link session to user if logged in
    if (userId) {
      await prisma.chatSession.upsert({
        where: { id: sessionId },
        create: { id: sessionId, userId },
        update: { userId }, 
      });
    } else {
      // For anonymous users, we still need to create the session record 
      // so we can attach messages to it in the DB
      await prisma.chatSession.upsert({
        where: { id: sessionId },
        create: { id: sessionId }, // No userId
        update: {}, 
      });
    }

    // 2. Save User Message
    await addMessage(sessionId, { role: 'user', content: message });

    // 3. Build Context (Only Last 2 Messages + Current)
    const recentHistory = await getRecentMessages(sessionId, 2);
    
    const systemPrompt = `You are a helpful blog-writing assistant. Answer the user's question in a detailed, structured format (like a mini-blog post) using Markdown.,but also be able to anser short qustion aswell if he is asking he is greeting or asking queestion outside of a paricalu topic , also mention you are moslty a blog writing ai tool `;
    const contextString = recentHistory.map(m => `${m.role}: ${m.content}`).join('\n');
    const finalPrompt = `${systemPrompt}\n\nRecent Context:\n${contextString}\n\nUser: ${message}\nAssistant:`;

    // 4. Stream Response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          const generator = generateLLMResponse(finalPrompt);
          let fullResponse = '';

          for await (const chunk of generator) {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          // 5. Save AI Response
          await addMessage(sessionId!, { role: 'assistant', content: fullResponse });
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    const response = new NextResponse(stream, {
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8', 
        'x-session-id': sessionId // Send new ID back to frontend
      }
    });

    // [!code change] Always update the cookie to the CURRENT session
    // This ensures if they refresh, they stay in *this* new room
    response.cookies.set('gpt_session_id', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return response;

  }  catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}