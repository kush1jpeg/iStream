import cron from "node-cron";
import { instance } from "../..";
import { PaymentModel } from "../../models/payments";

export function startSuperchatCron() {
  cron.schedule("0 */3 * * *", async () => {
    try {
      console.log("running the reconciliation service");

      const BATCH_SIZE = 100; // max
      let lastDB: any = null;
      const check = new Date(Date.now() - 5 * 60 * 1000);
      while (true) {
        const paymentsDB = await PaymentModel.find({
          status: "PENDING",
          _id: { $gt: lastDB, $lt: check },
        })
          .sort({ _id: 1 })
          .limit(BATCH_SIZE);
        if (paymentsDB.length == 0) break;
        for (const payment of paymentsDB) {
          if (payment.status === "SUCCESS") continue;
          const succ = await instance.orders.fetchPayments(payment.orderId);
          for (const e of succ.items) {
            if (e.status === "captured") {
              payment.status = "SUCCESS";
              payment.expiresAt = null;
              payment.providerPaymentId = e.id; // store razorpay_payment_id
              await payment.save();
              break; // no need to continue
            }
          }
        }
        lastDB = paymentsDB[paymentsDB.length - 1]._id;
      }
    } catch (err) {
      console.error("Error running reconciliation:", err);
    }
  });
}
