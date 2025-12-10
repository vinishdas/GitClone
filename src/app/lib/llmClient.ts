// src/app/lib/llmClient.ts

/**
 * LLM Client for generating streaming text responses using Google's Gemini API.
 */

/**
 * Generates a streaming text response from the Gemini API given a prompt.
 * * @param prompt - The text prompt to send to the LLM
 * @returns An AsyncGenerator that yields chunks of the generated text
 * @throws Error if the API key is missing or the request fails
 */
export async function* generateLLMResponse(prompt: string): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  // Use streamGenerateContent with alt=sse for Server-Sent Events
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse';
  
  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  };

  const response = await fetch(`${endpoint}&key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API request failed with status ${response.status}: ${errorText}`);
  }

  if (!response.body) {
    throw new Error('No response body received from Gemini API');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last line in the buffer if it's incomplete
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine.startsWith('data: ')) continue;

        const jsonStr = trimmedLine.slice(6); // Remove 'data: ' prefix
        if (jsonStr === '[DONE]') continue;

        try {
          const data = JSON.parse(jsonStr);
          const textChunk = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (textChunk) {
            yield textChunk;
          }
        } catch (e) {
          console.error('Error parsing streaming JSON:', e);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}