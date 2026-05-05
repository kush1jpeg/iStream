import { IPay } from "../../types/types";

export const purchaseNotification_Template = (data: IPay) => ({
  from: `"iStream" <kush1jpeg>`,
  to: data.email,
  subject: data.streamId
    ? "Your SuperChat was sent successfully 🎉"
    : "Your iStream Purchase Confirmation 🧾",

  text: `
Transaction Update on iStream

Status: ${data.status}
Amount: ₹${data.amount} INR
Stream: ${data.streamId ?? "N/A"}
Order ID: ${data.orderId}
Date: ${data.createdAt}

Thank you for supporting creators on iStream.

If you did not make this transaction, please contact support immediately.

— iStream Team
  `,

  html: `
    <div style="font-family: Arial, sans-serif; color:#333; max-width:600px; margin:auto;">
      <h2 style="color:#111;">
        ${data.streamId ? "SuperChat Sent 🚀" : "Purchase Confirmed ✅"}
      </h2>

      <p>Your recent activity on <strong>iStream</strong> has been processed.</p>

      <table style="width:100%; border-collapse: collapse; margin-top:16px;">
        <tr style="background:#f6f6f6;">
          <td style="padding:8px; font-weight:bold;">Status</td>
          <td style="padding:8px;">${data.status}</td>
        </tr>
        <tr>
          <td style="padding:8px; font-weight:bold;">Amount</td>
          <td style="padding:8px;">₹${data.amount} INR</td>
        </tr>
        <tr>
          <td style="padding:8px; font-weight:bold;">Order ID</td>
          <td style="padding:8px;">${data.orderId}</td>
        </tr>
        <tr style="background:#f6f6f6;">
          <td style="padding:8px; font-weight:bold;">Date</td>
          <td style="padding:8px;">${data.createdAt}</td>
        </tr>
      </table>

      <hr style="margin-top:24px;" />

      <p style="font-size:12px;color:#777;">
        If you did not make this transaction, contact support immediately.<br/>
        © ${new Date().getFullYear()} iStream
      </p>
    </div>
  `,
});
