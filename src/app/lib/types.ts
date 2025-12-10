// Shared types for chat and LLM interactions
export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
//  embedding:Float32Array;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  assistantMessage: string;
}
