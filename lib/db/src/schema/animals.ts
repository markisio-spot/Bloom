import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const animalsTable = pgTable("animals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  description: text("description").notNull(),
  cost: integer("cost").notNull(),
  rarity: text("rarity").notNull().default("common"),
});

export const userAnimalsTable = pgTable("user_animals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  animalId: integer("animal_id").notNull(),
  purchasedAt: text("purchased_at").notNull(),
});

export const insertAnimalSchema = createInsertSchema(animalsTable).omit({ id: true });
export type InsertAnimal = z.infer<typeof insertAnimalSchema>;
export type Animal = typeof animalsTable.$inferSelect;

export const insertUserAnimalSchema = createInsertSchema(userAnimalsTable).omit({ id: true });
export type InsertUserAnimal = z.infer<typeof insertUserAnimalSchema>;
export type UserAnimal = typeof userAnimalsTable.$inferSelect;
