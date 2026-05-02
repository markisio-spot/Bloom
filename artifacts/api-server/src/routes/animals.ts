import { Router } from "express";
import { db } from "@workspace/db";
import { animalsTable, userAnimalsTable, usersTable } from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/animals", async (_req, res) => {
  const animals = await db.select().from(animalsTable).orderBy(animalsTable.cost);
  res.json(animals);
});

router.get("/animals/owned", authMiddleware, async (req: AuthRequest, res) => {
  const owned = await db.select().from(userAnimalsTable)
    .where(eq(userAnimalsTable.userId, req.userId!));

  if (owned.length === 0) {
    res.json([]);
    return;
  }

  const animalIds = owned.map((ua) => ua.animalId);
  const animals = await db.select().from(animalsTable).where(inArray(animalsTable.id, animalIds));
  res.json(animals);
});

router.post("/animals/purchase", authMiddleware, async (req: AuthRequest, res) => {
  const { animalId } = req.body as { animalId?: number };
  if (!animalId) {
    res.status(400).json({ error: "animalId is required" });
    return;
  }

  const [animal] = await db.select().from(animalsTable).where(eq(animalsTable.id, animalId)).limit(1);
  if (!animal) {
    res.status(404).json({ error: "Animal not found" });
    return;
  }

  const alreadyOwned = await db.select().from(userAnimalsTable)
    .where(eq(userAnimalsTable.userId, req.userId!))
    .limit(1);

  const ownedAnimal = alreadyOwned.find((ua) => ua.animalId === animalId);
  if (ownedAnimal) {
    res.status(400).json({ error: "You already own this animal" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user || user.coins < animal.cost) {
    res.status(400).json({ error: "Not enough coins" });
    return;
  }

  await db.insert(userAnimalsTable).values({
    userId: req.userId!,
    animalId: animal.id,
    purchasedAt: new Date().toISOString().slice(0, 10),
  });

  const [updated] = await db.update(usersTable)
    .set({ coins: sql`${usersTable.coins} - ${animal.cost}` })
    .where(eq(usersTable.id, req.userId!))
    .returning();

  res.json({
    animal,
    newBalance: updated.coins,
  });
});

export default router;
