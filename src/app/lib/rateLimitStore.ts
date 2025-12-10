// src/app/lib/rateLimitStore.ts

const requestTimestamps = new Map<string, number>();

// Configuration
const COOLDOWN_MS = 3000; // 3 seconds
const CLEANUP_INTERVAL_MS = 60000; // 1 minute

export const checkRateLimit = (key: string): boolean => {
  const now = Date.now();
  const lastRequestTime = requestTimestamps.get(key);

  if (lastRequestTime && now - lastRequestTime < COOLDOWN_MS) {
    return false; // Too fast
  }

  requestTimestamps.set(key, now);
  return true;
};

// Periodically clean up old entries to prevent memory leaks
// FIX: Removed the unnecessary "if (global.setInterval)" check
setInterval(() => {
  const now = Date.now();
  requestTimestamps.forEach((timestamp, key) => {
    if (now - timestamp > COOLDOWN_MS) {
      requestTimestamps.delete(key);
    }
  });
}, CLEANUP_INTERVAL_MS);