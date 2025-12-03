import { initRabbitMQ, startWorker } from "./rabbitMq.js";

(async () => {
  await initRabbitMQ(["1080p", "720p", "480p"]);
  await startWorker(["1080p", "720p", "480p"]);
})();
