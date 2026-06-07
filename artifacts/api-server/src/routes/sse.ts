import { Router, type IRouter, type Request, type Response } from "express";
import { subscribe } from "../lib/sse-events";

const router: IRouter = Router();

router.get("/events", (req: Request, res: Response) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.write(":ok\n\n");

  const unsubContact = subscribe("contact", (data) => {
    res.write(`event: contact\ndata: ${JSON.stringify(data)}\n\n`);
  });

  const unsubMessage = subscribe("message", (data) => {
    res.write(`event: message\ndata: ${JSON.stringify(data)}\n\n`);
  });

  const keepAlive = setInterval(() => {
    res.write(":keepalive\n\n");
  }, 15000);

  req.on("close", () => {
    unsubContact();
    unsubMessage();
    clearInterval(keepAlive);
  });
});

export default router;
