import { prisma } from './prisma';
import type { ChatMessage } from './types';

export async function addMessage(
  sessionId: string,
  message: ChatMessage
): Promise<void> {
  // 1. Ensure session exists
  await prisma.chatSession.upsert({
    where: { id: sessionId },
    update: {},
    create: { id: sessionId },
  });

  // 2. Just save the message (No embeddings, no vectors)
  await prisma.message.create({
    data: {
      sessionId,
      role: message.role,
      content: message.content,
    },
  });
}

export async function getRecentMessages(sessionId: string, limit: number = 2): Promise<ChatMessage[]> {
  const messages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' }, // Get newest first
    take: limit,
  });

  // Reverse them back so they are in chronological order (Old -> New) for the AI
  return messages.reverse().map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));
}