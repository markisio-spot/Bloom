import { Router } from "express";
import { db } from "@workspace/db";
import { subjectProgressTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/progress", authMiddleware, async (req: AuthRequest, res) => {
  const progress = await db.select().from(subjectProgressTable)
    .where(eq(subjectProgressTable.userId, req.userId!));
  res.json(progress.map((p) => ({
    subject: p.subject,
    currentLevel: p.currentLevel,
    highestScore: p.highestScore,
    lessonsCompleted: p.lessonsCompleted,
    lastActivityAt: p.lastActivityAt?.toISOString() ?? null,
  })));
});

router.post("/progress", authMiddleware, async (req: AuthRequest, res) => {
  const { subject, level, score, exerciseType } = req.body as {
    subject?: string;
    level?: number;
    score?: number;
    exerciseType?: string;
  };

  if (!subject || !level || score === undefined || !exerciseType) {
    res.status(400).json({ error: "subject, level, score, and exerciseType are required" });
    return;
  }

  const [existing] = await db.select().from(subjectProgressTable)
    .where(and(
      eq(subjectProgressTable.userId, req.userId!),
      eq(subjectProgressTable.subject, subject)
    )).limit(1);

  let newLevel = existing?.currentLevel ?? level;
  if (score >= 80 && level >= newLevel) {
    newLevel = Math.min(level + 1, 12);
  }

  if (existing) {
    const [updated] = await db.update(subjectProgressTable)
      .set({
        currentLevel: newLevel,
        highestScore: sql`GREATEST(${subjectProgressTable.highestScore}, ${score})`,
        lessonsCompleted: sql`${subjectProgressTable.lessonsCompleted} + 1`,
        lastActivityAt: new Date(),
      })
      .where(and(
        eq(subjectProgressTable.userId, req.userId!),
        eq(subjectProgressTable.subject, subject)
      ))
      .returning();

    res.json({
      subject: updated.subject,
      currentLevel: updated.currentLevel,
      highestScore: updated.highestScore,
      lessonsCompleted: updated.lessonsCompleted,
      lastActivityAt: updated.lastActivityAt?.toISOString() ?? null,
    });
  } else {
    const [created] = await db.insert(subjectProgressTable).values({
      userId: req.userId!,
      subject,
      currentLevel: newLevel,
      highestScore: score,
      lessonsCompleted: 1,
      lastActivityAt: new Date(),
    }).returning();

    res.json({
      subject: created.subject,
      currentLevel: created.currentLevel,
      highestScore: created.highestScore,
      lessonsCompleted: created.lessonsCompleted,
      lastActivityAt: created.lastActivityAt?.toISOString() ?? null,
    });
  }
});

export default router;
