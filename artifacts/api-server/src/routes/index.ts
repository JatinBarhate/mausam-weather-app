import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mausamRouter from "./mausam";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mausamRouter);

export default router;
