import app from "./app.js";
import { logger } from "./lib/logger.js";
import { seedAnimals } from "./db/seed.js";
import { seedQuestions } from "./db/seedQuestions.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  try {
    await seedAnimals();
    logger.info("Animals seeded");
  } catch (seedErr) {
    logger.error({ err: seedErr }, "Failed to seed animals");
  }

  try {
    await seedQuestions();
    logger.info("Questions seeded");
  } catch (seedErr) {
    logger.error({ err: seedErr }, "Failed to seed questions");
  }
});
