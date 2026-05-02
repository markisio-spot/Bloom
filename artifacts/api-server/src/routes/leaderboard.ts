import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, userAnimalsTable, animalsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

const router = Router();

router.get("/leaderboard", async (_req, res) => {
  const users = await db.select({
    id: usersTable.id,
    displayName: usersTable.displayName,
    avatarData: usersTable.avatarData,
    coins: usersTable.coins,
    streakCount: usersTable.streakCount,
  }).from(usersTable).limit(50);

  const userIds = users.map((u) => u.id);
  if (userIds.length === 0) {
    res.json([]);
    return;
  }

  const ownedRows = await db.select().from(userAnimalsTable)
    .where(inArray(userAnimalsTable.userId, userIds));

  const animalIds = [...new Set(ownedRows.map((r) => r.animalId))];
  const animals = animalIds.length > 0
    ? await db.select().from(animalsTable).where(inArray(animalsTable.id, animalIds))
    : [];

  const animalMap = new Map(animals.map((a) => [a.id, a]));
  const userAnimalsMap = new Map<number, typeof animals>();

  for (const row of ownedRows) {
    if (!userAnimalsMap.has(row.userId)) {
      userAnimalsMap.set(row.userId, []);
    }
    const animal = animalMap.get(row.animalId);
    if (animal) {
      userAnimalsMap.get(row.userId)!.push(animal);
    }
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
