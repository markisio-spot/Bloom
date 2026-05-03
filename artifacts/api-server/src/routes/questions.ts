import { Router } from "express";
import { db, questionsTable, usersTable } from "@workspace/db";
import { and, eq, sql, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { buildLessonPrompt } from "./lessons.js";

const router = Router();

type QuestionType = "multiple_choice" | "fill_blank" | "match" | "write" | "speak";

interface QuestionData {
  id: string;
  question: string;
  type: QuestionType;
  options: string[] | null;
  correctAnswer: string;
  explanation: string | null;
  hint: string | null;
  speakText: string | null;
  pairs: Array<{ left: string; right: string }> | null;
}

// ── Admin check ───────────────────────────────────────────────────────────────
async function requireAdmin(req: AuthRequest, res: Parameters<typeof authMiddleware>[1], next: Parameters<typeof authMiddleware>[2]) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user?.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

// ── GET /questions/stats ──────────────────────────────────────────────────────
router.get("/questions/stats", authMiddleware, requireAdmin, async (_req, res) => {
  const stats = await db
    .select({ subject: questionsTable.subject, count: sql<number>`count(*)` })
    .from(questionsTable)
    .where(eq(questionsTable.isActive, true))
    .groupBy(questionsTable.subject);

  res.json(stats.map((s) => ({ subject: s.subject, count: Number(s.count) })));
});

// ── GET /questions ────────────────────────────────────────────────────────────
router.get("/questions", authMiddleware, requireAdmin, async (req: AuthRequest, res) => {
  const { subject, grade, exerciseType, languageSection, limit = "50", offset = "0" } = req.query as Record<string, string>;

  const conditions = [eq(questionsTable.isActive, true)] as Parameters<typeof and>;
  if (subject) conditions.push(eq(questionsTable.subject, subject));
  if (grade) conditions.push(eq(questionsTable.grade, Number(grade)));
  if (exerciseType) conditions.push(eq(questionsTable.exerciseType, exerciseType));
  if (languageSection) conditions.push(eq(questionsTable.languageSection, Number(languageSection)));

  const questions = await db
    .select()
    .from(questionsTable)
    .where(and(...conditions))
    .orderBy(desc(questionsTable.createdAt))
    .limit(Number(limit))
    .offset(Number(offset));

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(questionsTable)
    .where(and(...conditions));

  res.json({ questions, total: Number(total) });
});

// ── POST /questions ───────────────────────────────────────────────────────────
router.post("/questions", authMiddleware, requireAdmin, async (req: AuthRequest, res) => {
  const { subject, grade, exerciseType, languageSection, questionData } = req.body as {
    subject?: string;
    grade?: number;
    exerciseType?: string;
    languageSection?: number;
    questionData?: QuestionData;
  };

  if (!subject || !grade || !exerciseType || !questionData) {
    res.status(400).json({ error: "subject, grade, exerciseType, and questionData are required" });
    return;
  }

  const [q] = await db.insert(questionsTable).values({
    subject,
    grade: Number(grade),
    exerciseType,
    languageSection: languageSection ? Number(languageSection) : null,
    questionData,
  }).returning();

  res.status(201).json(q);
});

// ── PUT /questions/:id ────────────────────────────────────────────────────────
router.put("/questions/:id", authMiddleware, requireAdmin, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { questionData, isActive } = req.body as { questionData?: QuestionData; isActive?: boolean };

  const updates: Partial<typeof questionsTable.$inferInsert> = {};
  if (questionData !== undefined) updates.questionData = questionData;
  if (isActive !== undefined) updates.isActive = isActive;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [q] = await db.update(questionsTable).set(updates).where(eq(questionsTable.id, id)).returning();
  if (!q) { res.status(404).json({ error: "Question not found" }); return; }
  res.json(q);
});

// ── DELETE /questions/:id ─────────────────────────────────────────────────────
router.delete("/questions/:id", authMiddleware, requireAdmin, async (req: AuthRequest, res) => {
  await db.update(questionsTable).set({ isActive: false }).where(eq(questionsTable.id, Number(req.params.id)));
  res.json({ success: true });
});

// ── POST /questions/generate-batch ───────────────────────────────────────────
const SUBJECTS = ["math", "grammar", "history", "geography", "french", "spanish", "maltese", "italian"] as const;
const LANG_SUBJECTS = new Set(["french", "spanish", "maltese", "italian"]);
const LANG_SECTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

async function generateAndSave(subject: string, grade: number, exerciseType: string, langSection?: number): Promise<number> {
  const prompt = buildLessonPrompt(subject as Parameters<typeof buildLessonPrompt>[0], exerciseType, grade, langSection);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_completion_tokens: 5000,
    messages: [
      { role: "system", content: "You are a lesson generator. Respond with valid JSON only, no markdown." },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let lesson: { questions?: QuestionData[] };
  try {
    lesson = JSON.parse(raw) as { questions?: QuestionData[] };
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    lesson = match ? (JSON.parse(match[0]) as { questions?: QuestionData[] }) : {};
  }

  const questions = lesson.questions ?? [];
  if (questions.length === 0) return 0;

  await db.insert(questionsTable).values(
    questions.map((q) => ({
      subject,
      grade,
      exerciseType,
      languageSection: langSection ?? null,
      questionData: q,
    }))
  );

  return questions.length;
}

async function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, concurrency: number): Promise<T[]> {
  const results: T[] = [];
  const chunks: Array<Array<() => Promise<T>>> = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    chunks.push(tasks.slice(i, i + concurrency));
  }
  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map((t) => t()));
    results.push(...chunkResults);
  }
  return results;
}

router.post("/questions/generate-batch", authMiddleware, requireAdmin, async (req: AuthRequest, res) => {
  const { subject, questionsPerCombo = 10 } = req.body as {
    subject?: string;
    questionsPerCombo?: number;
  };

  const targetSubjects = subject ? [subject] : [...SUBJECTS];
  const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Build all generation tasks
  const tasks: Array<() => Promise<number>> = [];

  for (const subj of targetSubjects) {
    const isLang = LANG_SUBJECTS.has(subj);
    const callsNeeded = Math.ceil(questionsPerCombo / 16); // ~16 questions per AI call now

    if (isLang) {
      // For language subjects: each section × each grade
      for (const section of LANG_SECTIONS) {
        const sectionInfo = [
          { num: 1, exerciseType: "speak" }, { num: 2, exerciseType: "fill_blank" },
          { num: 3, exerciseType: "speak" }, { num: 4, exerciseType: "vocabulary" },
          { num: 5, exerciseType: "fill_blank" }, { num: 6, exerciseType: "matching" },
          { num: 7, exerciseType: "speak" }, { num: 8, exerciseType: "matching" },
          { num: 9, exerciseType: "fill_blank" }, { num: 10, exerciseType: "fill_blank" },
          { num: 11, exerciseType: "matching" }, { num: 12, exerciseType: "vocabulary" },
          { num: 13, exerciseType: "fill_blank" }, { num: 14, exerciseType: "speak" },
          { num: 15, exerciseType: "fill_blank" }, { num: 16, exerciseType: "writing" },
          { num: 17, exerciseType: "fill_blank" }, { num: 18, exerciseType: "writing" },
        ].find((s) => s.num === section);
        const exType = sectionInfo?.exerciseType ?? "vocabulary";

        for (let i = 0; i < callsNeeded; i++) {
          const grade = grades[(i + section) % grades.length]!;
          tasks.push(() => generateAndSave(subj, grade, exType, section));
        }
      }
    } else {
      // For non-language subjects: each grade × multiple calls
      const exerciseTypes: Record<string, string[]> = {
        math: ["mixed", "fill_blank", "word_problem"],
        grammar: ["spelling", "punctuation", "parts_of_speech", "word_definitions"],
        history: ["reading"],
        geography: ["reading"],
      };
      const types = exerciseTypes[subj] ?? ["multiple_choice"];

      for (const grade of grades) {
        for (const exType of types) {
          for (let i = 0; i < callsNeeded; i++) {
            tasks.push(() => generateAndSave(subj, grade, exType));
          }
        }
      }
    }
  }

  // Stream response headers immediately, run generation in background
  res.json({ message: "Batch generation started", totalTasks: tasks.length, subject: subject ?? "all" });

  // Run with concurrency of 8 in background
  runWithConcurrency(tasks, 8).catch(() => {});
});

export default router;
