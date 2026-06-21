import { Router, type IRouter } from "express";
import healthRouter from "./health";
import charactersRouter from "./characters";
import messagesRouter from "./messages";
import browserRouter from "./browser";
import contactsRouter from "./contacts";
import sseRouter from "./sse";
import aiRouter from "./ai";
import authRouter from "./auth";
import authPkceRouter from "./auth-pkce";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use('/auth', authPkceRouter);
router.use(charactersRouter);
router.use(messagesRouter);
router.use(browserRouter);
router.use(contactsRouter);
router.use(sseRouter);
router.use(aiRouter);

export default router;
