import { api } from "@/App";
import { verifyPayment } from "./verifyPayment";

const loadScript = () => {
  return new Promise((res, rej) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => res(true);
    document.body.appendChild(script);
  });
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export const handlePayment = async (productId: string) => {
  try {
    // create order  from BACKEND
    const { data } = await api.post("/api/create-order", {
      productId,
    });

    if (!data?.success) {
      throw new Error("Order creation failed");
    }

    // Loading razorpay script
    const isLoaded = await loadScript();
    if (!isLoaded) {
      throw new Error("Razorpay SDK failed to load");
    }

    // 3. Configure checkout
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY,
      amount: data.order.amount,
      currency: data.order.currency,
      order_id: data.order.id,

      handler: async (response: RazorpayResponse) => {
        try {
          await verifyPayment(response, data.transactionId);
        } catch (err) {
          console.error("Verification failed:", err);
        }
      },

      modal: {
        ondismiss: () => {
          console.log("Payment popup closed");
        },
      },
    };

    // 4. Open Razorpay
    const rzp = new (window as any).Razorpay(options);
    rzp.open();

  } catch (err) {
    console.error("Payment failed:", err);
  }
};
