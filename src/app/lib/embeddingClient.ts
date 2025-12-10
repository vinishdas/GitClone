// src/app/lib/embeddingClient.ts
/**
 * Embedding client for generating text embeddings using Google's Gemini API.
 */

/**
 * Generates an embedding vector from input text.
 * 
 * @param text - The text to convert into an embedding
 * @returns A number array representing the embedding vector (768 dimensions)
 * @throws Error if the API key is missing or the request fails
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent';

  const payload = {
    content: {
      parts: [
        {
          text: text
        }
      ]
    },
    outputDimensionality: 768
  };

  try {
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini embedding API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    const embeddingValues = data?.embedding?.values;

    if (!embeddingValues || !Array.isArray(embeddingValues)) {
      throw new Error('No embedding values received from Gemini API');
    }

    return embeddingValues;

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
    throw new Error('Failed to generate embedding: Unknown error');
  }
}
