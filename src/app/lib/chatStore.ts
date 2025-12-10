// src/app/lib/chatStore.ts
import { prisma } from './prisma';
import { generateEmbedding } from './embeddingClient';
import type { ChatMessage } from './types';

/**
 * Retrieves all messages for a given session from the database.
 * Returns an empty array if the session does not exist or has no messages.
 */
export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  const messages = await prisma.message.findMany({
    where: {
      sessionId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));
}

/**
 * Adds a message to the session's history in the database.
 * Creates a new session entry if it does not exist.
 * Generates and stores an embedding for the message content.
 */
export async function addMessage(
  sessionId: string,
  message: ChatMessage
): Promise<void> {
  // Ensure session exists
  await prisma.chatSession.upsert({
    where: {
      id: sessionId,
    },
    update: {},
    create: {
      id: sessionId,
    },
  });

  // Generate embedding for message content
  let embedding: number[] | null = null;
  try {
    embedding = await generateEmbedding(message.content);
  } catch (error) {
    // Fail safely: continue without embedding if generation fails
    console.error("Failed to generate embedding:", error);
    embedding = null;
  }

  if (embedding) {
    // FIX: Use $executeRaw because Prisma Client cannot write to Unsupported types directly
    const vectorString = `[${embedding.join(',')}]`;
    const id = crypto.randomUUID(); // Manually generate ID since Prisma defaults won't trigger in raw SQL

    await prisma.$executeRaw`
      INSERT INTO "Message" ("id", "sessionId", "role", "content", "embedding", "createdAt")
      VALUES (${id}, ${sessionId}, ${message.role}, ${message.content}, ${vectorString}::vector, NOW())
    `;
  } else {
    // Fallback: Use standard Prisma create if no embedding exists
    await prisma.message.create({
      data: {
        sessionId,
        role: message.role,
        content: message.content,
      },
    });
  }
}