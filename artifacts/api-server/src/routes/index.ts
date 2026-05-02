import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import animalsRouter from "./animals.js";
import leaderboardRouter from "./leaderboard.js";
import lessonsRouter from "./lessons.js";
import dailyChallengeRouter from "./dailyChallenge.js";
import progressRouter from "./progress.js";
import friendsRouter from "./friends.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(animalsRouter);
router.use(leaderboardRouter);
router.use(lessonsRouter);
router.use(dailyChallengeRouter);
router.use(progressRouter);
router.use(friendsRouter);

export default router;
