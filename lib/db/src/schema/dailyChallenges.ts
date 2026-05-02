import { pgTable, serial, text, integer, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyChallengesTable = pgTable("daily_challenges", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  subject: text("subject").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  coinReward: integer("coin_reward").notNull().default(50),
  questions: jsonb("questions").notNull(),
}, (table) => [
  uniqueIndex("daily_challenges_date_subject_idx").on(table.date, table.subject),
]);

export const challengeCompletionsTable = pgTable("challenge_completions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  challengeId: integer("challenge_id").notNull(),
  completedAt: text("completed_at").notNull(),
  coinsEarned: integer("coins_earned").notNull().default(0),
  score: integer("score").notNull().default(0),
});

export const insertDailyChallengeSchema = createInsertSchema(dailyChallengesTable).omit({ id: true });
export type InsertDailyChallenge = z.infer<typeof insertDailyChallengeSchema>;
export type DailyChallenge = typeof dailyChallengesTable.$inferSelect;

export const insertChallengeCompletionSchema = createInsertSchema(challengeCompletionsTable).omit({ id: true });
export type InsertChallengeCompletion = z.infer<typeof insertChallengeCompletionSchema>;
export type ChallengeCompletion = typeof challengeCompletionsTable.$inferSelect;
