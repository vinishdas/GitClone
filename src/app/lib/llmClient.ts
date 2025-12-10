/**
 * LLM Client for generating text responses using Google's Gemini API.
 * This module provides a simple interface to send prompts and receive text responses.
 */

/**
 * Generates a text response from the Gemini API given a prompt.
 * 
 * @param prompt - The text prompt to send to the LLM
 * @returns A string containing the generated response
 * @throws Error if the API key is missing, the request fails, or the response is empty
 */
export async function generateLLMResponse(prompt: string): Promise<string> {
  // Validate that the API key is present
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  // Construct the Gemini API endpoint
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  
  // Build the request payload following Gemini API structure
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

  try {
    // Make the API request using fetch
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Check if the response was successful
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API request failed with status ${response.status}: ${errorText}`);
    }

    // Parse the JSON response
    const data = await response.json();

    // Extract the text from the response structure
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    // Validate that we received content
    if (!generatedText) {
      throw new Error('No content received from Gemini API');
    }

    return generatedText;

  } catch (error) {
    // Re-throw errors with additional context
    if (error instanceof Error) {
      throw new Error(`Failed to generate LLM response: ${error.message}`);
    }
    throw new Error('Failed to generate LLM response: Unknown error');
  }
}
