// src/app/lib/memoryStore.ts
import type { ChatMessage } from './types';

const store = new Map<string, ChatMessage[]>();

/**
 * Retrieves all messages for a given session.
 * Returns an empty array if the session does not exist.
 */
export function getMessages(sessionId: string): ChatMessage[] {
  const messages = store.get(sessionId);
  return messages || [];
}

/**
 * Adds a message to the session's history.
 * Creates a new session entry if it does not exist.
 */
export function addMessage(sessionId: string, message: ChatMessage): void {
  const messages = store.get(sessionId);
  
  if (messages) {
    messages.push(message);
  } else {
    store.set(sessionId, [message]);
  }
}
