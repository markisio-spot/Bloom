import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { textToSpeech, speechToText } from "@workspace/integrations-openai-ai-server/audio";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

type Subject = "math" | "french" | "spanish" | "maltese" | "italian" | "grammar" | "history" | "geography";

function buildLessonPrompt(subject: Subject, exerciseType: string, level: number): string {
  const baseInstructions = `
You are a lesson generator for Bloom, a learning app for students up to grade 12.
Generate a lesson for: Subject="${subject}", Exercise Type="${exerciseType}", Level/Grade=${level}.
Return a JSON object ONLY (no markdown fences) with this exact structure:
{
  "id": "<unique string>",
  "subject": "${subject}",
  "exerciseType": "${exerciseType}",
  "level": ${level},
  "title": "<short lesson title>",
  "content": "<brief lesson intro or story (2-4 sentences max for exercises, longer for reading passages)>",
  "audioText": null,
  "questions": [
    {
      "id": "<unique string>",
      "question": "<question text>",
      "type": "<multiple_choice|fill_blank|match|write|speak>",
      "options": ["<option1>", "<option2>", "<option3>", "<option4>"] or null,
      "correctAnswer": "<correct answer>",
      "explanation": "<1-2 sentence explanation of WHY the correct answer is right, written simply for the student's grade level>",
      "pairs": null
    }
  ]
}

IMPORTANT: Always include the "explanation" field for every question. It should briefly explain the reasoning behind the correct answer so the student can learn from their mistakes.
`;

  const subjectPrompts: Record<Subject, Record<string, string>> = {
    math: {
      mixed: `Generate a grade-${level} mixed math lesson with exactly 6 questions in this order:
1. A multiple_choice arithmetic/algebra question (4 options, type "multiple_choice")
2. A fill_blank equation with one blank (e.g. "3 + __ = 10", type "fill_blank", options: null)
3. A multiple_choice word problem (real-world scenario, 4 options, type "multiple_choice")
4. A fill_blank equation (type "fill_blank", options: null)
5. A multiple_choice question testing a concept (type "multiple_choice")
6. A fill_blank equation (type "fill_blank", options: null)
Make them progressively harder and appropriate for grade ${level}. Set "pairs" to null for all.`,
      multiple_choice: `Generate 5 grade-${level} math problems (arithmetic, algebra, or geometry appropriate for the level). Each with 4 multiple choice options. Make them progressively harder.`,
      fill_blank: `Generate 5 grade-${level} math equations with a blank to fill in. For example "5 + __ = 12". Use type "fill_blank".`,
      word_problem: `Generate 3 grade-${level} math word problems. Use type "multiple_choice" with 4 options each.`,
    },
    french: {
      vocabulary: `Generate 6 French vocabulary flashcard questions for grade ${level}. Each question shows a French word and asks for the English translation (or vice versa). Use type "multiple_choice".`,
      fill_blank: `Generate 5 French fill-in-the-blank sentences. A French sentence with one word missing. Use type "fill_blank". For beginners (grade 1-3) use very simple sentences.`,
      matching: `Generate a matching exercise with 5 pairs of French-English words. Use type "match" and set "pairs" to an array of {left: "French", right: "English"} objects. Set "options" to null. Set correctAnswer to "matched".`,
      writing: `Generate 4 writing exercises where the student writes a word or short sentence in French. Provide the English prompt and the correct French answer. Use type "write".`,
      speaking: `Generate 3 speaking exercises where the student reads a French phrase aloud. Provide the phrase. Use type "speak". Set audioText in the response to the French phrases joined by ". ".`,
      listening: `Generate 4 listening exercises where the student hears a French phrase and picks the correct English translation. Use type "multiple_choice" with 4 options. Set audioText in the response to the French phrases that should be read aloud, joined by ". ".`,
    },
    spanish: {
      vocabulary: `Generate 6 Spanish vocabulary flashcard questions for grade ${level}. Each question shows a Spanish word and asks for the English translation. Use type "multiple_choice".`,
      fill_blank: `Generate 5 Spanish fill-in-the-blank sentences. A Spanish sentence with one word missing. Use type "fill_blank".`,
      matching: `Generate a matching exercise with 5 pairs of Spanish-English words. Use type "match" and set "pairs" to an array of {left: "Spanish", right: "English"} objects.`,
      writing: `Generate 4 writing exercises where the student writes a word or sentence in Spanish. Provide the English prompt. Use type "write".`,
      speaking: `Generate 3 speaking exercises where the student reads a Spanish phrase aloud. Use type "speak". Set audioText to the Spanish phrases.`,
      listening: `Generate 4 listening exercises where the student hears a Spanish phrase and picks the correct English translation. Use type "multiple_choice" with 4 options. Set audioText to the Spanish phrases.`,
    },
    maltese: {
      vocabulary: `Generate 6 Maltese vocabulary flashcard questions for grade ${level}. Maltese is the national language of Malta. Each question shows a Maltese word and asks for the English translation. Use type "multiple_choice".`,
      fill_blank: `Generate 5 Maltese fill-in-the-blank sentences. Use type "fill_blank".`,
      matching: `Generate a matching exercise with 5 pairs of Maltese-English words. Use type "match" and "pairs" array.`,
      writing: `Generate 4 writing exercises in Maltese. Provide English prompts. Use type "write".`,
      speaking: `Generate 3 Maltese speaking exercises. Use type "speak". Set audioText to the Maltese phrases.`,
      listening: `Generate 4 Maltese listening exercises. Use type "multiple_choice". Set audioText to the Maltese phrases.`,
    },
    italian: {
      vocabulary: `Generate 6 Italian vocabulary flashcard questions for grade ${level}. Use type "multiple_choice".`,
      fill_blank: `Generate 5 Italian fill-in-the-blank sentences. Use type "fill_blank".`,
      matching: `Generate a matching exercise with 5 Italian-English pairs. Use type "match" and "pairs" array.`,
      writing: `Generate 4 Italian writing exercises. Use type "write".`,
      speaking: `Generate 3 Italian speaking exercises. Use type "speak". Set audioText to the Italian phrases.`,
      listening: `Generate 4 Italian listening exercises. Use type "multiple_choice". Set audioText to the Italian phrases.`,
    },
    grammar: {
      spelling: `Generate 5 grade-${level} English spelling exercises. Show the word's definition or use it in a sentence, ask the student to choose the correct spelling. Use type "multiple_choice" with 4 options.`,
      punctuation: `Generate 5 grade-${level} punctuation exercises. Show a sentence and ask what punctuation is missing or incorrect. Use type "multiple_choice".`,
      parts_of_speech: `Generate 5 grade-${level} parts of speech exercises. Identify nouns, verbs, adjectives, etc. in sentences. Use type "multiple_choice".`,
      word_definitions: `Generate 5 grade-${level} vocabulary/definition exercises. Show a word and ask for its meaning. Use type "multiple_choice" with 4 options.`,
    },
    history: {
      reading: `Generate a history reading passage appropriate for grade ${level} (4-6 sentences covering an interesting historical event or person). Then create 4 comprehension questions in multiple_choice format (4 options each). Set "content" to the full reading passage.`,
    },
    geography: {
      reading: `Generate a geography reading passage appropriate for grade ${level} (4-6 sentences about a country, landmark, or geographic feature). Then create 4 comprehension questions in multiple_choice format (4 options each). Set "content" to the reading passage.`,
    },
  };

  const specificPrompt =
    (subjectPrompts[subject] as Record<string, string>)[exerciseType] ??
    `Generate 5 grade-${level} ${subject} questions using type "multiple_choice".`;

  return baseInstructions + "\n\nSpecific instructions:\n" + specificPrompt;
}

router.post("/lessons/generate", authMiddleware, async (req: AuthRequest, res) => {
  const { subject, exerciseType, level } = req.body as {
    subject?: Subject;
    exerciseType?: string;
    level?: number;
  };

  if (!subject) {
    res.status(400).json({ error: "subject is required" });
    return;
  }

  const type = exerciseType ?? (subject === "math" ? "mixed" : "multiple_choice");
  const lvl = level ?? 5;

  const prompt = buildLessonPrompt(subject, type, lvl);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_completion_tokens: 2000,
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
