import type { Request, Response } from "express";
import { container } from "../../../config/container.js";
import { env } from "../../../config/env.js";
import { loginDto } from "../dto/auth.dto.js";

const REFRESH_COOKIE = "refreshToken";

/**
 * `path` acota la cookie a las rutas de auth: el refresh token no viaja en cada
 * llamada al API, solo donde se canjea. `secure` sale de la config para que
 * también aplique cuando se corre con TLS fuera de producción.
 */
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: "strict",
  path: "/api/v1/auth",
} as const;

export async function login(req: Request, res: Response) {
  const input = loginDto.parse(req.body);
  const result = await container.auth.login.execute({
    username: input.username,
    password: input.password,
    ipAddress: req.ip ?? null,
    requestId: req.requestId ?? null,
  });

  res.cookie(REFRESH_COOKIE, result.refreshToken, {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken: result.accessToken, user: result.user });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "No hay refresh token" });
    return;
  }
  const result = await container.auth.refresh.execute(token);

  res.cookie(REFRESH_COOKIE, result.refreshToken, {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken: result.accessToken });
}

export async function me(req: Request, res: Response) {
  const user = await container.auth.me.execute(req.user!.userId);
  res.json({ user });
}

export async function logout(req: Request, res: Response) {
  if (req.user) {
    await container.auth.logout.execute({
      userId: req.user.userId,
      username: req.user.username,
      role: req.user.role,
      ipAddress: req.ip ?? null,
      requestId: req.requestId ?? null,
    });
  }
  res.clearCookie(REFRESH_COOKIE, REFRESH_COOKIE_OPTIONS);
  res.status(204).send();
}
