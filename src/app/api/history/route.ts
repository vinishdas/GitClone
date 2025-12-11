import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/auth';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;

  if (!authToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyToken(authToken);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const sessions = await prisma.chatSession.findMany({
      where: {
        userId: payload.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        messages: {
          take: 1, // Get the first message to use as a title/preview
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    // Format the response to be frontend-friendly
    const history = sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      title: session.messages[0]?.content.slice(0, 30) + '...' || 'New Chat',
    }));

    return NextResponse.json(history, { status: 200 });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}