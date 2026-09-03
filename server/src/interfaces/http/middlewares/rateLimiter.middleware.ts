import rateLimit from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "RATE_LIMITED", message: "Demasiados intentos. Intenta de nuevo más tarde." },
});

export const globalRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
