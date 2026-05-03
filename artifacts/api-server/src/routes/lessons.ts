import { Router } from "express";
import { textToSpeech, speechToText } from "@workspace/integrations-openai-ai-server/audio";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { db, questionsTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";

const router = Router();

type Subject = "math" | "french" | "spanish" | "maltese" | "italian" | "grammar" | "history" | "geography";
type LanguageSubject = "french" | "spanish" | "maltese" | "italian";

// ── Language curriculum sections ──────────────────────────────────────────────

const LANGUAGE_SECTIONS = [
  { num: 1,  name: "Greetings & Farewells",           exerciseType: "speak"      },
  { num: 2,  name: "Numbers 1–20",                    exerciseType: "fill_blank" },
  { num: 3,  name: "Colors",                          exerciseType: "speak"      },
  { num: 4,  name: "Days of the Week",                exerciseType: "vocabulary" },
  { num: 5,  name: "Months of the Year",              exerciseType: "fill_blank" },
  { num: 6,  name: "Family Members",                  exerciseType: "matching"   },
  { num: 7,  name: "Food & Drinks",                   exerciseType: "speak"      },
  { num: 8,  name: "Clothing",                        exerciseType: "matching"   },
  { num: 9,  name: "Weather & Seasons",               exerciseType: "fill_blank" },
  { num: 10, name: "Grammar: Articles & Gender",      exerciseType: "fill_blank" },
  { num: 11, name: "Body Parts & Health",             exerciseType: "matching"   },
  { num: 12, name: "Time Expressions",                exerciseType: "vocabulary" },
  { num: 13, name: "Grammar: Present Tense Verbs",    exerciseType: "fill_blank" },
  { num: 14, name: "Animals & Nature",                exerciseType: "speak"      },
  { num: 15, name: "Grammar: Adjectives",             exerciseType: "fill_blank" },
  { num: 16, name: "Sentence Translation (Beginner)", exerciseType: "writing"    },
  { num: 17, name: "Grammar: Past Tense",             exerciseType: "fill_blank" },
  { num: 18, name: "Sentence Translation (Advanced)", exerciseType: "writing"    },
];

const LANGUAGE_NAMES: Record<LanguageSubject, string> = {
  french:  "French",
  spanish: "Spanish",
  maltese: "Maltese",
  italian: "Italian",
};

// ── Shared question format instructions ───────────────────────────────────────

const QUESTION_FORMAT = `
Each question object must follow this exact structure:
{
  "id": "<unique string>",
  "question": "<question text>",
  "type": "<multiple_choice|fill_blank|match|write|speak>",
  "options": ["<opt1>","<opt2>","<opt3>","<opt4>"] or null,
  "correctAnswer": "<correct answer>",
  "explanation": "<1-2 sentence explanation of WHY the correct answer is right, written simply for the student's grade level>",
  "hint": "<a helpful nudge toward the answer WITHOUT revealing it — max 1 sentence>",
  "speakText": "<the target-language word or phrase to pronounce aloud — for speak/vocabulary questions: the exact target-language word/phrase the student should say or hear; for fill_blank/writing: the correct target-language content; null for non-language questions>",
  "pairs": null
}

IMPORTANT:
- Always include "explanation", "hint", and "speakText" fields for every question.
- The "hint" must NOT give away the answer.
- For match questions, set "pairs" to [{left:"...", right:"..."},...] and set "type" to "match", "options" to null, "correctAnswer" to "matched".
- For non-language subjects, set "speakText" to null.
`;

// ── Prompt builder ─────────────────────────────────────────────────────────────

function buildLessonPrompt(subject: Subject, exerciseType: string, level: number, languageSection?: number): string {
  const baseInstructions = `
You are a lesson generator for Bloom, a learning app for students up to grade 12.
Generate a lesson and return a JSON object ONLY (no markdown fences) with this exact structure:
{
  "id": "<unique string>",
  "subject": "${subject}",
  "exerciseType": "${exerciseType}",
  "level": ${level},
  "title": "<short lesson title>",
  "content": "<brief lesson intro (2-4 sentences)>",
  "audioText": null,
  "questions": [ ... ]
}

${QUESTION_FORMAT}
`;

  // ── Math ──
  if (subject === "math") {
    const mathPrompts: Record<string, string> = {
      mixed: `Generate a grade-${level} mixed math lesson with exactly 12 questions:
1. multiple_choice arithmetic/algebra question (4 options)
2. fill_blank equation with one blank (e.g. "3 + __ = 10", options: null)
3. multiple_choice word problem (real-world scenario, 4 options)
4. fill_blank equation (options: null)
5. multiple_choice conceptual question (4 options)
6. fill_blank equation (options: null)
7. multiple_choice arithmetic/algebra question (4 options)
8. fill_blank equation (options: null)
9. multiple_choice word problem (4 options)
10. fill_blank equation (options: null)
11. multiple_choice conceptual question (4 options)
12. fill_blank equation (options: null)
Make progressively harder. Set "pairs" to null for all. Set "speakText" to null for all.`,
      multiple_choice: `Generate 10 grade-${level} math problems. Each with 4 multiple choice options. Set "speakText" to null for all.`,
      fill_blank: `Generate 10 grade-${level} math equations with a blank. Use type "fill_blank". Set "speakText" to null for all.`,
      word_problem: `Generate 6 grade-${level} math word problems. Use type "multiple_choice" with 4 options each. Set "speakText" to null for all.`,
    };
    const prompt = mathPrompts[exerciseType] ?? `Generate 5 grade-${level} math questions using type "multiple_choice". Set "speakText" to null for all.`;
    return baseInstructions + "\n\nSpecific instructions:\n" + prompt;
  }

  // ── Grammar ──
  if (subject === "grammar") {
    const grammarPrompts: Record<string, string> = {
      spelling: `Generate 10 grade-${level} English spelling exercises. Use type "multiple_choice" with 4 options. Set "speakText" to null for all.`,
      punctuation: `Generate 10 grade-${level} punctuation exercises. Use type "multiple_choice". Set "speakText" to null for all.`,
      parts_of_speech: `Generate 10 grade-${level} parts of speech exercises. Use type "multiple_choice". Set "speakText" to null for all.`,
      word_definitions: `Generate 10 grade-${level} vocabulary/definition exercises. Use type "multiple_choice" with 4 options. Set "speakText" to null for all.`,
    };
    const prompt = grammarPrompts[exerciseType] ?? `Generate 5 grade-${level} English grammar questions using type "multiple_choice". Set "speakText" to null for all.`;
    return baseInstructions + "\n\nSpecific instructions:\n" + prompt;
  }

  // ── History / Geography ──
  if (subject === "history" || subject === "geography") {
    const topic = subject === "history" ? "historical event or person" : "country, landmark, or geographic feature";
    const prompt = `Generate a ${subject} reading passage appropriate for grade ${level} (4-6 sentences covering an interesting ${topic}). Then create 8 comprehension questions in multiple_choice format (4 options each). Set "content" to the full reading passage. Set "speakText" to null for all questions.`;
    return baseInstructions + "\n\nSpecific instructions:\n" + prompt;
  }

  // ── Languages ──
  const langName = LANGUAGE_NAMES[subject as LanguageSubject] ?? subject;
  const section = LANGUAGE_SECTIONS.find((s) => s.num === languageSection) ?? LANGUAGE_SECTIONS[0]!;

  const langBaseInstructions = `
You are a lesson generator for Bloom, a learning app for students up to grade 12.
Generate a lesson and return a JSON object ONLY (no markdown fences) with this exact structure:
{
  "id": "<unique string>",
  "subject": "${subject}",
  "exerciseType": "${exerciseType}",
  "level": ${level},
  "title": "<short lesson title>",
  "content": "<brief lesson intro (2-4 sentences)>",
  "audioText": null,
  "vocabulary": [
    {"word": "<${langName} word/phrase>", "meaning": "<English translation>", "pronunciation": "<phonetic e.g. bon-ZHOOR>"},
    ... exactly 6-8 entries covering the key words/phrases for this section
  ],
  "questions": [ ... ]
}

For the "vocabulary" array: include exactly 6-8 key ${langName} words or phrases that will appear in this section's questions.
- "word": the exact ${langName} word/phrase as written
- "meaning": the English translation (concise, 1-4 words)
- "pronunciation": a simple phonetic spelling for English speakers, with stressed syllables in CAPS
  Examples: "bonjour" → "bon-ZHOOR", "buenos días" → "BWEH-nos DEE-ahs", "ciao" → "CHOW", "merci" → "mehr-SEE"

${QUESTION_FORMAT}
`;

  const sectionPrompts: Record<string, string> = {
    vocabulary: `Generate 12 ${langName} vocabulary questions focused on the topic "${section.name}".
Each question shows a ${langName} word/phrase and asks for the English meaning (or vice versa).
Use type "multiple_choice" with 4 options.
For each question, set "speakText" to the ${langName} word/phrase from the question (always the target-language content to pronounce).`,

    fill_blank: `Generate 10 ${langName} fill-in-the-blank sentences focused on the topic "${section.name}".
Each is a ${langName} sentence with one word/phrase missing. Use type "fill_blank", options: null.
Set "speakText" to the complete correct ${langName} sentence (with the blank filled in).`,

    matching: `Generate a matching exercise with 12 pairs focused on the topic "${section.name}" in ${langName}.
Use type "match". Set "pairs" to [{left:"${langName} word/phrase", right:"English meaning"},...].
Set "options" to null. Set "correctAnswer" to "matched".
Set "speakText" to a comma-separated list of the ${langName} words/phrases from the left column.`,

    speak: `Generate 10 ${langName} speaking exercises focused on the topic "${section.name}".
Each question shows an English word/phrase and the student must say it in ${langName}.
Use type "speak". 
The "question" field should be: "Say in ${langName}: [English word or phrase]".
The "correctAnswer" field should be the exact correct ${langName} word/phrase.
The "speakText" field must be exactly the ${langName} word/phrase the student needs to say (same as correctAnswer).
Keep vocabulary practical and common for beginners learning "${section.name}".`,

    writing: `Generate 10 writing exercises focused on the topic "${section.name}" in ${langName}.
${languageSection && languageSection >= 16
  ? `Each question provides an English sentence that the student must translate into ${langName}. Use type "write". The "question" field should be the English sentence to translate. The "correctAnswer" field should be the correct ${langName} translation. Set "speakText" to the correct ${langName} translation.`
  : `Each question provides an English word/phrase and the student must write it in ${langName}. Use type "write". Provide the English prompt in the "question" field and the correct ${langName} answer in "correctAnswer". Set "speakText" to the correct ${langName} answer.`
}`,
  };

  const specificPrompt = sectionPrompts[section.exerciseType] ??
    `Generate 10 ${langName} questions about "${section.name}" using type "multiple_choice". Set "speakText" to the target-language content for each question.`;

  const sectionContext = `
This is Section ${section.num}/18 of the ${langName} curriculum: "${section.name}".
Focus ALL questions specifically on this topic/section. Do not mix in unrelated vocabulary or grammar.
Tailor difficulty to a student who is learning ${langName} at the ${section.num <= 6 ? "beginner" : section.num <= 12 ? "intermediate" : "advanced"} level.
`;

  return langBaseInstructions + sectionContext + "\n\nSpecific instructions:\n" + specificPrompt;
}

export { buildLessonPrompt };

// ── Routes ─────────────────────────────────────────────────────────────────────

router.post("/lessons/generate", authMiddleware, async (req: AuthRequest, res) => {
  const { subject, exerciseType, level, languageSection } = req.body as {
    subject?: Subject;
    exerciseType?: string;
    level?: number;
    languageSection?: number;
  };

  if (!subject) {
    res.status(400).json({ error: "subject is required" });
    return;
  }

  const isLanguage = ["french", "spanish", "maltese", "italian"].includes(subject);
  const section = isLanguage
    ? (LANGUAGE_SECTIONS.find((s) => s.num === (languageSection ?? 1)) ?? LANGUAGE_SECTIONS[0]!)
    : null;

  const type = exerciseType ?? (subject === "math" ? "mixed" : section?.exerciseType ?? "multiple_choice");
  const lvl = level ?? 5;

  // ── Try DB first ─────────────────────────────────────────────────────────────
  const conditions = [
    eq(questionsTable.subject, subject),
    eq(questionsTable.grade, lvl),
    eq(questionsTable.isActive, true),
  ] as Parameters<typeof and>;
  if (isLanguage && languageSection) {
    conditions.push(eq(questionsTable.languageSection, languageSection));
  }

  const [{ qcount }] = await db.select({ qcount: sql<number>`count(*)` }).from(questionsTable).where(and(...conditions));

  if (Number(qcount) < 10) {
    res.status(404).json({ error: "Not enough questions available for this subject and grade. Please check back later." });
    return;
  }

  const dbRows = await db.select().from(questionsTable)
    .where(and(...conditions))
    .orderBy(sql`RANDOM()`)
    .limit(10);

  const dbLesson = {
    id: `db-${Date.now()}`,
    subject,
    exerciseType: type,
    level: lvl,
    title: `${subject.charAt(0).toUpperCase() + subject.slice(1)} — Grade ${lvl}`,
    content: "",
    audioText: null,
    questions: dbRows.map((r) => r.questionData),
  };
  res.json(dbLesson);
});

router.post("/lessons/tts", authMiddleware, async (req: AuthRequest, res) => {
  const { text, voice } = req.body as { text?: string; voice?: string };
  if (!text) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  const audioBuffer = await textToSpeech(text, (voice as "nova") ?? "nova");
  const base64 = audioBuffer.toString("base64");
  res.json({ audio: base64, mimeType: "audio/mpeg" });
});

router.post("/lessons/transcribe", authMiddleware, async (req: AuthRequest, res) => {
  const { audioBase64 } = req.body as { audioBase64?: string };
  if (!audioBase64) {
    res.status(400).json({ error: "audioBase64 is required" });
    return;
  }

  const buffer = Buffer.from(audioBase64, "base64");
  const transcript = await speechToText(buffer);
  res.json({ transcript });
});

export default router;
