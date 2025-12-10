// src/app/lib/semanticSearch.ts
import { prisma } from './prisma';
import type { Message } from '@prisma/client';

/**
 * Retrieves the most semantically relevant messages for a given session
 * using pgvector cosine distance.
 * 
 * @param sessionId - The session to search within
 * @param queryEmbedding - The embedding vector to compare against (768 dimensions)
 * @param limit - Maximum number of results to return (default: 5)
 * @returns Array of messages ordered by semantic similarity (most similar first)
 */
export async function getRelevantMessages(
  sessionId: string,
  queryEmbedding: number[],
  limit: number = 5
): Promise<Message[]> {
  try {
    const embeddingString = `[${queryEmbedding.join(',')}]`;
    
    const messages = await prisma.$queryRaw<Message[]>`
      SELECT *
      FROM "Message"
      WHERE "sessionId" = ${sessionId}
        AND embedding IS NOT NULL
      ORDER BY embedding <-> ${embeddingString}::vector
      LIMIT ${limit}
    `;

    return messages;
  } catch (error) {
    return [];
  }
}
