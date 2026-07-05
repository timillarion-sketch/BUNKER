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
import authExtraRouter from "./auth-extra";
import templatesRouter from "./templates";
import feedRouter from "./feed";
import interactionRouter from "./interaction";
import authTelegramRouter from "./auth-telegram";
import botRouter from "./bot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(authExtraRouter);
router.use('/auth', authPkceRouter);
router.use(charactersRouter);
router.use(messagesRouter);
router.use(browserRouter);
router.use(contactsRouter);
router.use(sseRouter);
router.use(aiRouter);
router.use(templatesRouter);
router.use(feedRouter);
router.use(interactionRouter);
router.use(authTelegramRouter);
router.use(botRouter);

export default router;
