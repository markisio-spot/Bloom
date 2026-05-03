import { pgTable, serial, text, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  grade: integer("grade").notNull(),
  exerciseType: text("exercise_type").notNull(),
  languageSection: integer("language_section"),
  questionData: jsonb("question_data").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type StoredQuestion = typeof questionsTable.$inferSelect;
export type InsertQuestion = typeof questionsTable.$inferInsert;
