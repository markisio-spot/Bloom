import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, signToken, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.post("/auth/register", async (req, res) => {
  const { username, password, displayName } = req.body as {
    username?: string;
    password?: string;
    displayName?: string;
  };

  if (!username || !password || !displayName) {
    res.status(400).json({ error: "username, password, and displayName are required" });
    return;
  }
  if (username.length < 3 || username.length > 30) {
    res.status(400).json({ error: "Username must be 3-30 characters" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const isFirstUser = Number(count) === 0;

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    username: username.toLowerCase(),
    passwordHash,
    displayName,
    coins: 100,
    streakCount: 0,
    isAdmin: isFirstUser,
  }).returning();

  const token = signToken(user.id);
  res.status(201).json({
    token,
    user: sanitizeUser(user),
  });
});

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    res.status(400).json({ error: "username and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username.toLowerCase())).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const token = signToken(user.id);
  res.json({
    token,
    user: sanitizeUser(user),
  });
});

router.get("/auth/me", authMiddleware, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(sanitizeUser(user));
});

function sanitizeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    coins: user.coins,
    streakCount: user.streakCount,
    lastActivityDate: user.lastActivityDate,
    lastGiftDate: user.lastGiftDate,
    avatarData: user.avatarData,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
  };
}

export default router;
