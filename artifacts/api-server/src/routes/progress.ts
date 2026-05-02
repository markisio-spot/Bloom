import { Router } from "express";
import { db } from "@workspace/db";
import { subjectProgressTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

const MAX_LANGUAGE_SECTIONS = 18;

router.get("/progress", authMiddleware, async (req: AuthRequest, res) => {
  const progress = await db.select().from(subjectProgressTable)
    .where(eq(subjectProgressTable.userId, req.userId!));
  res.json(progress.map((p) => ({
    subject: p.subject,
    currentLevel: p.currentLevel,
    highestScore: p.highestScore,
    lessonsCompleted: p.lessonsCompleted,
    languageSection: p.languageSection,
    lastActivityAt: p.lastActivityAt?.toISOString() ?? null,
  })));
});

router.post("/progress", authMiddleware, async (req: AuthRequest, res) => {
  const { subject, level, score, exerciseType, languageSection } = req.body as {
    subject?: string;
    level?: number;
    score?: number;
    exerciseType?: string;
    languageSection?: number;
  };

  if (!subject || !level || score === undefined || !exerciseType) {
    res.status(400).json({ error: "subject, level, score, and exerciseType are required" });
    return;
  }

  const isLanguage = ["french", "spanish", "maltese", "italian"].includes(subject);

  const [existing] = await db.select().from(subjectProgressTable)
    .where(and(
      eq(subjectProgressTable.userId, req.userId!),
      eq(subjectProgressTable.subject, subject)
    )).limit(1);

  // Level advancement (non-language or language level)
  let newLevel = existing?.currentLevel ?? level;
  if (score >= 80 && level >= newLevel) {
    newLevel = Math.min(level + 1, 12);
  }

  // Language section advancement: advance if score >= 60%
  const currentSection = existing?.languageSection ?? languageSection ?? 1;
  let newSection = currentSection;
  if (isLanguage && languageSection !== undefined && score >= 60) {
    // Only advance if this was the current section (not a replay of an old one)
    if (languageSection >= currentSection) {
      newSection = Math.min(currentSection + 1, MAX_LANGUAGE_SECTIONS);
    }
  }

  if (existing) {
    const [updated] = await db.update(subjectProgressTable)
      .set({
        currentLevel: newLevel,
        highestScore: sql`GREATEST(${subjectProgressTable.highestScore}, ${score})`,
        lessonsCompleted: sql`${subjectProgressTable.lessonsCompleted} + 1`,
        languageSection: isLanguage ? newSection : existing.languageSection,
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
      languageSection: updated.languageSection,
      lastActivityAt: updated.lastActivityAt?.toISOString() ?? null,
    });
  } else {
    const [created] = await db.insert(subjectProgressTable).values({
      userId: req.userId!,
      subject,
      currentLevel: newLevel,
      highestScore: score,
      lessonsCompleted: 1,
      languageSection: languageSection ?? 1,
      lastActivityAt: new Date(),
    }).returning();

    res.json({
      subject: created.subject,
      currentLevel: created.currentLevel,
      highestScore: created.highestScore,
      lessonsCompleted: created.lessonsCompleted,
      languageSection: created.languageSection,
      lastActivityAt: created.lastActivityAt?.toISOString() ?? null,
    });
  }
});

export default router;
