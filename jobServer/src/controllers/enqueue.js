import { getChannel } from "../config/rabbitmq.js";
import { verifyStreamKey } from "../helpers/support.js";

export const enqueueTasks = async (req, res) => {
  console.log("[+] reached enqueue");

  const channel = await getChannel();
  if (!channel) return res.status(503).send("RabbitMQ not ready");

  const { MTX_PATH } = req.body;
  if (!MTX_PATH) return res.status(400).send("Missing fields");
  const streamKey = MTX_PATH.split("/")[1];

  if (!(await verifyStreamKey(streamKey))) {
    return res.status(400).send("streamKey Not verified");
  }

  channel.sendToQueue("stream.jobs", Buffer.from(JSON.stringify(MTX_PATH)), {
    persistent: true,
  });
  console.log(`[+] Job enqueued for stream ${streamKey}`);
  res.send({ status: "ok" });
};
