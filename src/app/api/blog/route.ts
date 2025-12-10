import { NextRequest, NextResponse } from 'next/server';
import { generateLLMResponse } from '@/app/lib/llmClient';
import { getOrCreateSessionId } from '@/app/lib/session';

interface BlogRequest {
  topic: string;
}

interface BlogResponse {
  blogHtml: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: unknown = await request.json();

    // Validate the request structure
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { topic } = body as Partial<BlogRequest>;

    // Validate topic field
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    if (typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic must be a string' },
        { status: 400 }
      );
    }

    if (topic.trim().length === 0) {
      return NextResponse.json(
        { error: 'Topic cannot be empty' },
        { status: 400 }
      );
    }

    // Construct the blog generation prompt
    const blogPrompt = `You are a professional blog writer. Generate a complete, well-structured blog post about the following topic: "${topic}"

STRICT REQUIREMENTS:
- Output ONLY valid HTML
- Do NOT use Markdown
- Do NOT include any meta commentary or explanations
- Use <h1> for the main title
- Use <h2> for section headings
- Use <p> for paragraphs
- Use <ul> and <li> for bullet lists where appropriate
- Write approximately 1000 words
- Include an introduction, multiple detailed sections, and a clear conclusion
- Use a professional, neutral tone
- Do NOT use emojis
- Do NOT start with phrases like "this blog will discuss" or "in this article"

Begin with the HTML output directly.`;

    // Generate the blog content
    const blogHtml = await generateLLMResponse(blogPrompt);

    // Return the response
    const response: BlogResponse = {
      blogHtml,
    };

    const nextResponse = NextResponse.json(response, { status: 200 });

    // Establish or retrieve session
    const sessionId = getOrCreateSessionId(request, nextResponse);

    return nextResponse;

  } catch (error) {
    // Handle internal errors
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
