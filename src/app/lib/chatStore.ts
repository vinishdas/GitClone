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
    embedding = null;
  }

  // Create the message with embedding
  await prisma.message.create({
    data: {
      sessionId,
      role: message.role,
      content: message.content,
      embedding: embedding,
    },
  });
}
