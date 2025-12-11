import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/auth';

// [!code ++] Add this line to force dynamic rendering and skip static data collection
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const authToken = request.cookies.get('auth_token')?.value;

  if (!authToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyToken(authToken);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    // Ensure the session belongs to the user
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: payload.userId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Map to ChatMessage type
    const messages = session.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


// ... existing imports ...

// [!code ++] ADD THIS EXPORT CONST DYNAMIC IF YOU DELETED THE PREVIOUS ONE (KEEP ONLY ONE AT THE TOP)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const authToken = request.cookies.get('auth_token')?.value;

  if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(authToken);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  try {
    // Verify ownership and delete
    const deleted = await prisma.chatSession.deleteMany({
      where: {
        id: sessionId,
        userId: payload.userId, // Ensures user can only delete their own chats
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}