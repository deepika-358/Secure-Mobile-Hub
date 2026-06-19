import { Router, type IRouter } from "express";
import healthRouter from "./health";
import articlesRouter from "./articles";
import statsRouter from "./stats";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(articlesRouter);
router.use(statsRouter);
router.use(adminRouter);

export default router;
