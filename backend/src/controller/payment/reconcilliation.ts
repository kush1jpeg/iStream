import cron from "node-cron";
import { instance } from "../..";
import { PaymentModel } from "../../models/payments";

export function startSuperchatCron() {
  cron.schedule("0 */3 * * *", async () => {
    try {
      console.log("[+] running the reconciliation service");

      const BATCH_SIZE = 100; // max
      let lastDB: any = null;
      const check = new Date(Date.now() - 5 * 60 * 1000); // last 5 mins
      while (true) {
        const paymentsDB = await PaymentModel.find({
          status: "PENDING",
          createdAt: { $gt: lastDB, $lt: check },
        })
          .sort({ _id: 1 })
          .limit(BATCH_SIZE);
        if (paymentsDB.length == 0) break;
        for (const payment of paymentsDB) {
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
        lastDB = paymentsDB[paymentsDB.length - 1].createdAt;
      }
    } catch (err) {
      console.error("Error running reconciliation:", err);
    }
  });
}

// this currently is n-calls to rzp and n-writes to mongo which i know is shite;
// better idea is to get the ids in bulk from rzp use skip+from/to  and then cross check from mongo and do a bulk update of mongo or something else
