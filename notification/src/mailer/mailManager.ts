import { forgotPass_Template } from "./templates/forgotPass_Template";
import { passwordChangeSuccess_Template } from "./templates/passChangeSuccess_Template";
import { purchaseNotification_Template } from "./templates/payment_Template";
import { firstStreamOTP_Template } from "./templates/verification_Template";

export const MailTemplates = {
  forgotPassword: forgotPass_Template,
  firstStreamOTP: firstStreamOTP_Template,
  passwordChangeSuccess: passwordChangeSuccess_Template,
  purchaseNotification: purchaseNotification_Template,
};
