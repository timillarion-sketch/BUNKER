import { logger } from "./logger";

interface QueueTask {
  id: string;
  userId: number;
  characterId: string;
  message: string;
  execute: () => Promise<string>;
}

type TaskHandler = (task: QueueTask) => Promise<string>;

class AIQueue {
  private queue: QueueTask[] = [];
  private processing = false;
  private concurrency = 1;
  private activeCount = 0;
  private handler: TaskHandler | null = null;
  private maxSize = 50;

  setMaxSize(size: number) {
    this.maxSize = size;
  }

  setHandler(handler: TaskHandler) {
    this.handler = handler;
  }

  async enqueue(task: Omit<QueueTask, "execute">): Promise<string> {
    if (this.queue.length >= this.maxSize) {
      throw new Error("AI queue is full. Try again later.");
    }

    return new Promise((resolve, reject) => {
      const wrapped: QueueTask = {
        ...task,
        execute: async () => {
          if (!this.handler) throw new Error("No handler set");
          return this.handler(task);
        },
      };

      this.queue.push(wrapped);
      this.processNext();

      // We need to resolve when this specific task completes
      // Override execute to resolve/reject the promise
      const originalExecute = wrapped.execute.bind(wrapped);
      wrapped.execute = async () => {
        try {
          const result = await originalExecute();
          resolve(result);
          return result;
        } catch (err) {
          reject(err);
          throw err;
        }
      };

      this.processNext();
    });
  }

  private async processNext() {
    if (this.processing || this.activeCount >= this.concurrency) return;
    if (this.queue.length === 0) return;

    this.processing = true;
    const task = this.queue.shift()!;
    this.activeCount++;

    try {
      logger.info({ taskId: task.id, userId: task.userId }, "Processing AI queue task");
      await task.execute();
    } catch (err) {
      logger.error({ err, taskId: task.id }, "AI queue task failed");
    } finally {
      this.activeCount--;
      this.processing = false;
      this.processNext();
    }
  }

  get pending(): number {
    return this.queue.length;
  }
}

export const aiQueue = new AIQueue();
