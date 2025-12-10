// src/app/lib/session.ts
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'gpt_session_id';

/**
 * Gets an existing session ID from cookies or generates a new one.
 * If a new session ID is created, it is attached to the response as a cookie.
 */
export function getOrCreateSessionId(
  req: NextRequest,
  res: NextResponse
): string {
  // Try to read existing session ID from cookies
  const existingSessionId = req.cookies.get(COOKIE_NAME)?.value;

  if (existingSessionId) {
    return existingSessionId;
  }

  // Generate a new session ID
  const newSessionId = crypto.randomUUID();

  // Attach cookie to response
  res.cookies.set(COOKIE_NAME, newSessionId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  return newSessionId;
}
