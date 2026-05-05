export const passwordChangeSuccess_Template = (email: string) => ({
  from: `"iStream" <kush1jpeg>`,
  to: email,
  subject: "Your iStream Password Was Changed",
  text: `Your iStream password has been successfully changed.\n\nIf you did not perform this action, contact support immediately.\n\n— iStream Security`,
  html: `
    <div style="font-family: Arial, sans-serif; color:#333;">
      <h2>Password Updated 🔒</h2>
      <p>Your password was successfully changed.</p>
      <p>If this wasn’t you, please contact support immediately.</p>
      <hr />
      <p style="font-size:12px;color:#777;">© ${new Date().getFullYear()} iStream</p>
    </div>
  `,
});
