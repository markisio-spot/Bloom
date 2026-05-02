import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subjectProgressTable = pgTable("subject_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subject: text("subject").notNull(),
  currentLevel: integer("current_level").notNull().default(1),
  highestScore: integer("highest_score").notNull().default(0),
  lessonsCompleted: integer("lessons_completed").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at"),
});

export const insertSubjectProgressSchema = createInsertSchema(subjectProgressTable).omit({ id: true });
export type InsertSubjectProgress = z.infer<typeof insertSubjectProgressSchema>;
export type SubjectProgress = typeof subjectProgressTable.$inferSelect;
