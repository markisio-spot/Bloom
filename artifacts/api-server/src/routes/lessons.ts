import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { textToSpeech, speechToText } from "@workspace/integrations-openai-ai-server/audio";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

type Subject = "math" | "french" | "spanish" | "maltese" | "italian" | "grammar" | "history" | "geography";
type LanguageSubject = "french" | "spanish" | "maltese" | "italian";

// ── Language curriculum sections ──────────────────────────────────────────────

const LANGUAGE_SECTIONS = [
  { num: 1,  name: "Greetings & Farewells",      exerciseType: "vocabulary" },
  { num: 2,  name: "Numbers 1–20",               exerciseType: "fill_blank" },
  { num: 3,  name: "Colors",                     exerciseType: "matching"   },
  { num: 4,  name: "Days of the Week",           exerciseType: "vocabulary" },
  { num: 5,  name: "Months of the Year",         exerciseType: "fill_blank" },
  { num: 6,  name: "Family Members",             exerciseType: "matching"   },
  { num: 7,  name: "Food & Drinks",              exerciseType: "vocabulary" },
  { num: 8,  name: "Clothing",                   exerciseType: "matching"   },
  { num: 9,  name: "Weather & Seasons",          exerciseType: "fill_blank" },
  { num: 10, name: "Grammar: Articles & Gender", exerciseType: "fill_blank" },
  { num: 11, name: "Body Parts & Health",        exerciseType: "matching"   },
  { num: 12, name: "Time Expressions",           exerciseType: "vocabulary" },
  { num: 13, name: "Grammar: Present Tense Verbs", exerciseType: "fill_blank" },
  { num: 14, name: "Animals & Nature",           exerciseType: "vocabulary" },
  { num: 15, name: "Grammar: Adjectives",        exerciseType: "fill_blank" },
  { num: 16, name: "Sentence Translation (Beginner)", exerciseType: "writing" },
  { num: 17, name: "Grammar: Past Tense",        exerciseType: "fill_blank" },
  { num: 18, name: "Sentence Translation (Advanced)", exerciseType: "writing" },
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
  "hint": "<a helpful nudge toward the answer WITHOUT revealing it — e.g. think about the rule for..., remember that..., the answer rhymes with... — max 1 sentence>",
  "pairs": null
}

IMPORTANT:
- Always include BOTH "explanation" and "hint" fields for every question.
- The "hint" must NOT give away the answer. It should guide the student to think, not tell them.
- For match questions, set "pairs" to [{left:"...", right:"..."},...] and set "type" to "match", "options" to null, "correctAnswer" to "matched".
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
      mixed: `Generate a grade-${level} mixed math lesson with exactly 6 questions:
1. multiple_choice arithmetic/algebra question (4 options)
2. fill_blank equation with one blank (e.g. "3 + __ = 10", options: null)
3. multiple_choice word problem (real-world scenario, 4 options)
4. fill_blank equation (options: null)
5. multiple_choice conceptual question (4 options)
6. fill_blank equation (options: null)
Make progressively harder. Set "pairs" to null for all.`,
      multiple_choice: `Generate 5 grade-${level} math problems (arithmetic, algebra, or geometry). Each with 4 multiple choice options. Make them progressively harder.`,
      fill_blank: `Generate 5 grade-${level} math equations with a blank to fill in. Example: "5 + __ = 12". Use type "fill_blank".`,
      word_problem: `Generate 3 grade-${level} math word problems. Use type "multiple_choice" with 4 options each.`,
    };
    const prompt = mathPrompts[exerciseType] ?? `Generate 5 grade-${level} math questions using type "multiple_choice".`;
    return baseInstructions + "\n\nSpecific instructions:\n" + prompt;
  }

  // ── Grammar ──
  if (subject === "grammar") {
    const grammarPrompts: Record<string, string> = {
      spelling: `Generate 5 grade-${level} English spelling exercises. Show the word's definition or use it in a sentence, ask the student to choose the correct spelling. Use type "multiple_choice" with 4 options.`,
      punctuation: `Generate 5 grade-${level} punctuation exercises. Show a sentence and ask what punctuation is missing or incorrect. Use type "multiple_choice".`,
      parts_of_speech: `Generate 5 grade-${level} parts of speech exercises. Identify nouns, verbs, adjectives, etc. in sentences. Use type "multiple_choice".`,
      word_definitions: `Generate 5 grade-${level} vocabulary/definition exercises. Show a word and ask for its meaning. Use type "multiple_choice" with 4 options.`,
    };
    const prompt = grammarPrompts[exerciseType] ?? `Generate 5 grade-${level} English grammar questions using type "multiple_choice".`;
    return baseInstructions + "\n\nSpecific instructions:\n" + prompt;
  }

  // ── History / Geography ──
  if (subject === "history" || subject === "geography") {
    const topic = subject === "history" ? "historical event or person" : "country, landmark, or geographic feature";
    const prompt = `Generate a ${subject} reading passage appropriate for grade ${level} (4-6 sentences covering an interesting ${topic}). Then create 4 comprehension questions in multiple_choice format (4 options each). Set "content" to the full reading passage.`;
    return baseInstructions + "\n\nSpecific instructions:\n" + prompt;
  }

  // ── Languages ──
  const langName = LANGUAGE_NAMES[subject as LanguageSubject] ?? subject;
  const section = LANGUAGE_SECTIONS.find((s) => s.num === languageSection) ?? LANGUAGE_SECTIONS[0]!;

  const sectionPrompts: Record<string, string> = {
    vocabulary: `Generate 6 ${langName} vocabulary questions focused on the topic "${section.name}".
Each question shows a ${langName} word/phrase and asks for the English meaning (or vice versa).
Use type "multiple_choice" with 4 options. Make questions appropriate and varied.`,

    fill_blank: `Generate 5 ${langName} fill-in-the-blank sentences focused on the topic "${section.name}".
Each is a ${langName} sentence with one word/phrase missing. Use type "fill_blank", options: null.
For "${section.name}" grammar sections, the blank should test the specific grammar rule being taught.`,

    matching: `Generate a matching exercise with 6 pairs focused on the topic "${section.name}" in ${langName}.
Use type "match". Set "pairs" to [{left:"${langName} word/phrase", right:"English meaning"},...].
Set "options" to null. Set "correctAnswer" to "matched".`,

    writing: `Generate 5 writing exercises focused on the topic "${section.name}" in ${langName}.
${languageSection && languageSection >= 16
  ? `Each question provides an English sentence that the student must translate into ${langName}. Use type "write". The "question" field should be the English sentence to translate. The "correctAnswer" field should be the correct ${langName} translation.`
  : `Each question provides an English word/phrase and the student must write it in ${langName}. Use type "write". Provide the English prompt in the "question" field and the correct ${langName} answer in "correctAnswer".`
}`,
  };

  const specificPrompt = sectionPrompts[section.exerciseType] ??
    `Generate 5 ${langName} questions about "${section.name}" using type "multiple_choice".`;

  const sectionContext = `
This is Section ${section.num}/18 of the ${langName} curriculum: "${section.name}".
Focus ALL questions specifically on this topic/section. Do not mix in unrelated vocabulary or grammar.
Tailor difficulty to a student who is learning ${langName} at the ${section.num <= 6 ? "beginner" : section.num <= 12 ? "intermediate" : "advanced"} level.
`;

  return baseInstructions + sectionContext + "\n\nSpecific instructions:\n" + specificPrompt;
}

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

  const prompt = buildLessonPrompt(subject, type, lvl, languageSection ?? 1);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_completion_tokens: 2500,
    messages: [
      { role: "system", content: "You are a lesson generator. Respond with valid JSON only, no markdown." },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let lesson: unknown;
  try {
    lesson = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    lesson = match ? JSON.parse(match[0]) : {};
  }

  res.json(lesson);
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
