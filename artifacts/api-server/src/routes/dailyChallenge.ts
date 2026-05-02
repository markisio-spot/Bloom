import { Router } from "express";
import { db } from "@workspace/db";
import {
  dailyChallengesTable,
  challengeCompletionsTable,
  subjectProgressTable,
  usersTable,
} from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

const FALLBACK_SUBJECTS = ["math", "grammar", "history", "geography", "french", "spanish", "italian"];

async function generateDailyChallenge(date: string, subject: string, level: number) {
  const levelHint = level > 1 ? ` Target difficulty: grade ${level}.` : "";
  const prompt = `Generate a personalized daily challenge for the Bloom learning app. Subject: "${subject}".${levelHint}
Create a mini-quiz with 3 questions based on this subject at the appropriate level. Return JSON ONLY (no markdown):
{
  "title": "<engaging challenge title>",
  "description": "<1 sentence description>",
  "coinReward": 50,
  "questions": [
    {
      "id": "q1",
      "question": "<question>",
      "type": "multiple_choice",
      "options": ["<a>", "<b>", "<c>", "<d>"],
      "correctAnswer": "<correct option text>",
      "pairs": null
    },
    {
      "id": "q2",
      "question": "<question>",
      "type": "multiple_choice",
      "options": ["<a>", "<b>", "<c>", "<d>"],
      "correctAnswer": "<correct option text>",
      "pairs": null
    },
    {
      "id": "q3",
      "question": "<question>",
      "type": "multiple_choice",
      "options": ["<a>", "<b>", "<c>", "<d>"],
      "correctAnswer": "<correct option text>",
      "pairs": null
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_completion_tokens: 900,
    messages: [
      { role: "system", content: "You are a lesson generator. Respond with valid JSON only." },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let data: { title?: string; description?: string; coinReward?: number; questions?: unknown[] };
  try {
    data = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    data = match ? JSON.parse(match[0]) : {};
  }

  const [challenge] = await db.insert(dailyChallengesTable).values({
    date,
    subject,
    title: data.title ?? `Daily ${subject.charAt(0).toUpperCase() + subject.slice(1)} Challenge`,
    description: data.description ?? `Complete today's ${subject} challenge`,
    coinReward: 50,
    questions: data.questions ?? [],
  }).returning();

  return challenge;
}

router.get("/daily-challenge", authMiddleware, async (req: AuthRequest, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const userId = req.userId!;

  const userProgress = await db
    .select()
    .from(subjectProgressTable)
    .where(eq(subjectProgressTable.userId, userId))
    .orderBy(desc(subjectProgressTable.lastActivityAt))
    .limit(5);

  let challengeSubject: string;
  let challengeLevel = 1;

  if (userProgress.length > 0) {
    const top = userProgress[0];
    challengeSubject = top.subject;
    challengeLevel = top.currentLevel;
  } else {
    challengeSubject = FALLBACK_SUBJECTS[new Date(today).getDate() % FALLBACK_SUBJECTS.length] ?? "math";
  }

  let [challenge] = await db
    .select()
    .from(dailyChallengesTable)
    .where(
      and(
        eq(dailyChallengesTable.date, today),
        eq(dailyChallengesTable.subject, challengeSubject)
      )
    )
    .limit(1);

  if (!challenge) {
    challenge = await generateDailyChallenge(today, challengeSubject, challengeLevel);
  }

  const [completion] = await db.select().from(challengeCompletionsTable)
    .where(and(
      eq(challengeCompletionsTable.userId, userId),
      eq(challengeCompletionsTable.challengeId, challenge.id)
    )).limit(1);

  res.json({
    ...challenge,
    questions: challenge.questions as unknown[],
    completed: !!completion,
  });
});

router.post("/daily-challenge/complete", authMiddleware, async (req: AuthRequest, res) => {
  const { challengeId, answers } = req.body as {
    challengeId?: number;
    answers?: string[];
  };

  if (!challengeId || !answers) {
    res.status(400).json({ error: "challengeId and answers are required" });
    return;
  }

  const [alreadyDone] = await db.select().from(challengeCompletionsTable)
    .where(and(
      eq(challengeCompletionsTable.userId, req.userId!),
      eq(challengeCompletionsTable.challengeId, challengeId)
    )).limit(1);

  if (alreadyDone) {
    res.status(400).json({ error: "Already completed today's challenge" });
    return;
  }

  const [challenge] = await db.select().from(dailyChallengesTable)
    .where(eq(dailyChallengesTable.id, challengeId)).limit(1);

  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const questions = challenge.questions as Array<{ correctAnswer: string }>;
  let correct = 0;
  for (let i = 0; i < questions.length; i++) {
    if (answers[i]?.toLowerCase().trim() === questions[i]?.correctAnswer?.toLowerCase().trim()) {
      correct++;
    }
  }

  const score = Math.round((correct / Math.max(questions.length, 1)) * 100);
  const passed = score >= 60;
  const coinsEarned = passed ? challenge.coinReward : Math.floor(challenge.coinReward * 0.25);

  await db.insert(challengeCompletionsTable).values({
    userId: req.userId!,
    challengeId,
    completedAt: new Date().toISOString().slice(0, 10),
    coinsEarned,
    score,
  });

  const [updated] = await db.update(usersTable)
    .set({ coins: sql`${usersTable.coins} + ${coinsEarned}` })
    .where(eq(usersTable.id, req.userId!))
    .returning();

  res.json({ coinsEarned, newBalance: updated.coins, score, passed });
});

export default router;
