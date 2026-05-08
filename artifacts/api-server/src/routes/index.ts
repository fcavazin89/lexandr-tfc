import { Router, type IRouter } from "express";
import healthRouter from "./health";
import anthropicRouter from "./anthropic";
import researchRouter from "./research";

const router: IRouter = Router();

router.use(healthRouter);
router.use(anthropicRouter);
router.use(researchRouter);

export default router;
