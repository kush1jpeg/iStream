import { api } from "@/App";

export const verifyPayment = async (response: any, transactionId: string) => {
  api.post("/verify-payment", {
    ...response,
    transactionId,
  })
}

// [Button Click]
//       ↓
// Frontend (React component)
//       ↓
// /create-order (backend)
//       ↓
// Razorpay Checkout (popup)
//       ↓
// Frontend handler()
//       ↓
// /verify-payment (backend)
//       ↓
// DB update (truth)
