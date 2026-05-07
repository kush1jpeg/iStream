import { getPublishChannel } from "../../config/rabbitmq";
import { INotification } from "../../types/types";

export async function publishNotifs(msg: INotification) {
  const publishChannel = await getPublishChannel();
  publishChannel.publish(
    "notification",
    msg.type,
    Buffer.from(JSON.stringify(msg)),
    { persistent: true }, // survive restart
    (err, ok) => {
      if (err !== null) {
        console.error("Message nacked! by the broker", err);
        return 0;
      } else {
        return 1;
      }
    },
  );
}
