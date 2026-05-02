import { db } from "@workspace/db";
import { animalsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const animals = [
  { name: "Dog", emoji: "🐕", description: "A loyal and friendly companion", cost: 50, rarity: "common" },
  { name: "Cat", emoji: "🐈", description: "An independent and graceful feline", cost: 60, rarity: "common" },
  { name: "Rabbit", emoji: "🐇", description: "A fluffy and gentle bunny", cost: 70, rarity: "common" },
  { name: "Hamster", emoji: "🐹", description: "A tiny and adorable furball", cost: 75, rarity: "common" },
  { name: "Parrot", emoji: "🦜", description: "A colorful bird that mimics speech", cost: 90, rarity: "common" },
  { name: "Fish", emoji: "🐟", description: "A peaceful aquatic friend", cost: 45, rarity: "common" },
  { name: "Fox", emoji: "🦊", description: "A clever and agile forest dweller", cost: 200, rarity: "uncommon" },
  { name: "Deer", emoji: "🦌", description: "A graceful creature of the forest", cost: 220, rarity: "uncommon" },
  { name: "Owl", emoji: "🦉", description: "The wise guardian of the night", cost: 250, rarity: "uncommon" },
  { name: "Penguin", emoji: "🐧", description: "A tuxedo-wearing Antarctic bird", cost: 280, rarity: "uncommon" },
  { name: "Turtle", emoji: "🐢", description: "A slow but ancient creature", cost: 230, rarity: "uncommon" },
  { name: "Flamingo", emoji: "🦩", description: "An elegant pink wading bird", cost: 350, rarity: "uncommon" },
  { name: "Wolf", emoji: "🐺", description: "A fierce and loyal pack hunter", cost: 500, rarity: "rare" },
  { name: "Eagle", emoji: "🦅", description: "The majestic king of the skies", cost: 600, rarity: "rare" },
  { name: "Dolphin", emoji: "🐬", description: "An intelligent and playful sea creature", cost: 650, rarity: "rare" },
  { name: "Cheetah", emoji: "🐆", description: "The fastest land animal on Earth", cost: 700, rarity: "rare" },
  { name: "Giant Panda", emoji: "🐼", description: "A beloved black-and-white bear", cost: 800, rarity: "rare" },
  { name: "Lion", emoji: "🦁", description: "The proud king of the savanna", cost: 1000, rarity: "epic" },
  { name: "Tiger", emoji: "🐯", description: "A powerful striped apex predator", cost: 1200, rarity: "epic" },
  { name: "Elephant", emoji: "🐘", description: "The gentle giant with perfect memory", cost: 1500, rarity: "epic" },
  { name: "Gorilla", emoji: "🦍", description: "The mighty king of the jungle", cost: 1400, rarity: "epic" },
  { name: "Snow Leopard", emoji: "🐱", description: "The elusive ghost of the mountains", cost: 2500, rarity: "legendary" },
  { name: "Orca", emoji: "🐋", description: "The ocean's apex predator", cost: 3000, rarity: "legendary" },
  { name: "Dragon Komodo", emoji: "🦎", description: "The world's largest living lizard", cost: 2000, rarity: "legendary" },
  { name: "Arctic Fox", emoji: "🦊", description: "A magical white fox of the frozen north", cost: 3500, rarity: "legendary" },
];

export async function seedAnimals() {
  const existing = await db.select({ count: sql<number>`count(*)` }).from(animalsTable);
  if (Number(existing[0]?.count) > 0) return;

  await db.insert(animalsTable).values(animals);
}
