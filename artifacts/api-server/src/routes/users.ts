import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.put("/users/me", authMiddleware, async (req: AuthRequest, res) => {
  const { displayName, avatarData } = req.body as {
    displayName?: string;
    avatarData?: string;
  };

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (displayName !== undefined) {
    if (displayName.length < 1 || displayName.length > 30) {
      res.status(400).json({ error: "Display name must be 1-30 characters" });
      return;
    }
    updates.displayName = displayName;
  }
  if (avatarData !== undefined) {
    updates.avatarData = avatarData;
  }

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.userId!)).returning();
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    coins: user.coins,
    streakCount: user.streakCount,
    lastActivityDate: user.lastActivityDate,
    lastGiftDate: user.lastGiftDate,
    avatarData: user.avatarData,
    createdAt: user.createdAt,
  });
});

router.post("/users/me/coins", authMiddleware, async (req: AuthRequest, res) => {
  const { amount } = req.body as { amount?: number };
  if (typeof amount !== "number" || amount < 0) {
    res.status(400).json({ error: "Invalid amount" });
    return;
  }

  const [user] = await db.update(usersTable)
    .set({ coins: sql`${usersTable.coins} + ${amount}` })
    .where(eq(usersTable.id, req.userId!))
    .returning();

  res.json({ coins: user.coins });
});

router.post("/users/me/claim-gift", authMiddleware, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const today = new Date();
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const lastGift = user.lastGiftDate;

  if (lastGift && lastGift.startsWith(thisMonth)) {
    res.status(400).json({ error: "Gift already claimed this month" });
    return;
  }

  const giftCoins = Math.floor(Math.random() * 151) + 50;
  const [updated] = await db.update(usersTable)
    .set({
      coins: sql`${usersTable.coins} + ${giftCoins}`,
      lastGiftDate: today.toISOString().slice(0, 10),
    })
    .where(eq(usersTable.id, req.userId!))
    .returning();

  res.json({
    coins: giftCoins,
    message: `You received ${giftCoins} coins as your monthly gift!`,
    newBalance: updated.coins,
  });
});

router.post("/users/me/streak", authMiddleware, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const lastActivity = user.lastActivityDate;

  let newStreak = user.streakCount;
  let isNewDay = false;

  if (lastActivity === today) {
    res.json({
      streakCount: newStreak,
      isNewDay: false,
      message: "Already checked in today",
    });
    return;
  }

  isNewDay = true;
  if (lastActivity === yesterday) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  await db.update(usersTable)
    .set({ streakCount: newStreak, lastActivityDate: today })
    .where(eq(usersTable.id, req.userId!));

  res.json({
    streakCount: newStreak,
    isNewDay: true,
    message: newStreak > 1 ? `${newStreak} day streak! Keep it up!` : "Streak started! Come back tomorrow!",
  });
});

export default router;
