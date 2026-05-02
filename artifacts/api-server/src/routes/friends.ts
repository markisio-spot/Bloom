import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, friendshipsTable, userAnimalsTable, animalsTable } from "@workspace/db";
import { eq, or, and, inArray, ilike } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

// Search users by username or display name
router.get("/users/search", authMiddleware, async (req: AuthRequest, res) => {
  const q = (req.query.q as string ?? "").trim();
  if (!q || q.length < 2) {
    res.json([]);
    return;
  }
  const results = await db
    .select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, avatarData: usersTable.avatarData })
    .from(usersTable)
    .where(or(ilike(usersTable.username, `%${q}%`), ilike(usersTable.displayName, `%${q}%`)))
    .limit(20);

  const filtered = results.filter((u) => u.id !== req.userId);
  res.json(filtered);
});

// Send a friend request
router.post("/friends/request", authMiddleware, async (req: AuthRequest, res) => {
  const { targetUserId } = req.body as { targetUserId?: number };
  if (!targetUserId) {
    res.status(400).json({ error: "targetUserId is required" });
    return;
  }
  if (targetUserId === req.userId) {
    res.status(400).json({ error: "Cannot friend yourself" });
    return;
  }

  const existing = await db
    .select()
    .from(friendshipsTable)
    .where(
      or(
        and(eq(friendshipsTable.requesterId, req.userId!), eq(friendshipsTable.addresseeId, targetUserId)),
        and(eq(friendshipsTable.requesterId, targetUserId), eq(friendshipsTable.addresseeId, req.userId!))
      )
    )
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Request already exists", status: existing[0]?.status });
    return;
  }

  const [friendship] = await db
    .insert(friendshipsTable)
    .values({ requesterId: req.userId!, addresseeId: targetUserId, status: "pending" })
    .returning();

  res.status(201).json(friendship);
});

// Respond to a friend request (accept / decline)
router.put("/friends/:id/respond", authMiddleware, async (req: AuthRequest, res) => {
  const friendshipId = parseInt(req.params.id, 10);
  const { status } = req.body as { status?: "accepted" | "declined" };
  if (!status || !["accepted", "declined"].includes(status)) {
    res.status(400).json({ error: "status must be accepted or declined" });
    return;
  }

  const [existing] = await db
    .select()
    .from(friendshipsTable)
    .where(and(eq(friendshipsTable.id, friendshipId), eq(friendshipsTable.addresseeId, req.userId!)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const [updated] = await db
    .update(friendshipsTable)
    .set({ status })
    .where(eq(friendshipsTable.id, friendshipId))
    .returning();

  res.json(updated);
});

// Get accepted friends
router.get("/friends", authMiddleware, async (req: AuthRequest, res) => {
  const rows = await db
    .select()
    .from(friendshipsTable)
    .where(
      and(
        or(eq(friendshipsTable.requesterId, req.userId!), eq(friendshipsTable.addresseeId, req.userId!)),
        eq(friendshipsTable.status, "accepted")
      )
    );

  const friendIds = rows.map((r) =>
    r.requesterId === req.userId ? r.addresseeId : r.requesterId
  );

  if (friendIds.length === 0) {
    res.json([]);
    return;
  }

  const friends = await db
    .select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, avatarData: usersTable.avatarData, coins: usersTable.coins, streakCount: usersTable.streakCount })
    .from(usersTable)
    .where(inArray(usersTable.id, friendIds));

  res.json(friends.map((f) => ({ ...f, friendshipId: rows.find((r) => r.requesterId === f.id || r.addresseeId === f.id)?.id })));
});

// Get pending incoming friend requests
router.get("/friends/requests", authMiddleware, async (req: AuthRequest, res) => {
  const rows = await db
    .select()
    .from(friendshipsTable)
    .where(and(eq(friendshipsTable.addresseeId, req.userId!), eq(friendshipsTable.status, "pending")));

  if (rows.length === 0) {
    res.json([]);
    return;
  }

  const requesterIds = rows.map((r) => r.requesterId);
  const requesters = await db
    .select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, avatarData: usersTable.avatarData })
    .from(usersTable)
    .where(inArray(usersTable.id, requesterIds));

  res.json(rows.map((r) => ({
    friendshipId: r.id,
    createdAt: r.createdAt,
    requester: requesters.find((u) => u.id === r.requesterId),
  })));
});

// Remove / cancel a friendship
router.delete("/friends/:id", authMiddleware, async (req: AuthRequest, res) => {
  const friendshipId = parseInt(req.params.id, 10);
  const [existing] = await db
    .select()
    .from(friendshipsTable)
    .where(
      and(
        eq(friendshipsTable.id, friendshipId),
        or(eq(friendshipsTable.requesterId, req.userId!), eq(friendshipsTable.addresseeId, req.userId!))
      )
    )
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Friendship not found" });
    return;
  }

  await db.delete(friendshipsTable).where(eq(friendshipsTable.id, friendshipId));
  res.json({ success: true });
});

// Friends leaderboard
router.get("/friends/leaderboard", authMiddleware, async (req: AuthRequest, res) => {
  const rows = await db
    .select()
    .from(friendshipsTable)
    .where(
      and(
        or(eq(friendshipsTable.requesterId, req.userId!), eq(friendshipsTable.addresseeId, req.userId!)),
        eq(friendshipsTable.status, "accepted")
      )
    );

  const friendIds = rows.map((r) =>
    r.requesterId === req.userId ? r.addresseeId : r.requesterId
  );
  const allIds = [req.userId!, ...friendIds];

  const users = await db
    .select({ id: usersTable.id, displayName: usersTable.displayName, avatarData: usersTable.avatarData, coins: usersTable.coins, streakCount: usersTable.streakCount })
    .from(usersTable)
    .where(inArray(usersTable.id, allIds));

  const ownedRows = await db.select().from(userAnimalsTable).where(inArray(userAnimalsTable.userId, allIds));
  const animalIds = [...new Set(ownedRows.map((r) => r.animalId))];
  const animals = animalIds.length > 0 ? await db.select().from(animalsTable).where(inArray(animalsTable.id, animalIds)) : [];
  const animalMap = new Map(animals.map((a) => [a.id, a]));
  const userAnimalsMap = new Map<number, typeof animals>();
  for (const row of ownedRows) {
    if (!userAnimalsMap.has(row.userId)) userAnimalsMap.set(row.userId, []);
    const animal = animalMap.get(row.animalId);
    if (animal) userAnimalsMap.get(row.userId)!.push(animal);
  }

  const entries = users.map((user) => {
    const userAnimals = userAnimalsMap.get(user.id) ?? [];
    return {
      userId: user.id,
      displayName: user.displayName,
      avatarData: user.avatarData,
      coins: user.coins,
      streakCount: user.streakCount,
      animalCount: userAnimals.length,
      animals: userAnimals,
    };
  }).sort((a, b) => b.animalCount - a.animalCount || b.coins - a.coins);

  res.json(entries);
});

export default router;
