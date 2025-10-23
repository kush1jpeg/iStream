import { Router } from "express";
import { register } from "../controller/register.js";
import { login, loginXgoogle } from "../controller/login.js";
import { deleteAcc, logout } from "../controller/logout.js";
import { authVerify } from "../middlewares/jwtVerify.js";
import { sendOTP, verifyOTP } from "../controller/otp.js";
import { isVerified } from "../middlewares/verified.js";
import {
  forgotPass,
  resetPass,
  verifyandChangePass,
} from "../controller/resetPass.js";
import { validate } from "../middlewares/validateZOD.js";
import {
  forgotPassSchema,
  loginSchema,
  resetPassSchema,
  verifyAndChangePassSchema,
} from "../validation/authSchemas.js";
import type { PassportStatic } from "passport";

export const authRouter = (passport: PassportStatic): Router => {
  console.log(passport);
  const authRouter = Router();
  authRouter.post("/register", validate(loginSchema), register);
  authRouter.post("/login", validate(loginSchema), login);
  authRouter.get(
    "/login/google",
    passport.authenticate("google", { scope: ["profile", "email"] }),
  );
  authRouter.get(
    "/login/google/callback",
    passport.authenticate("google", { failureRedirect: "/api/auth" }),
    loginXgoogle,
  );
  authRouter.post("/logout", authVerify, logout);
  authRouter.post("/delete", authVerify, deleteAcc);

  // password reset on authpage -> those  who forgot the password
  authRouter.post("/forgotPass", validate(forgotPassSchema), forgotPass);
  authRouter.post(
    "/verifyPass",
    validate(verifyAndChangePassSchema),
    verifyandChangePass,
  );

  // password reset inside the app -> those who want to change their password
  authRouter.post("/reset", validate(resetPassSchema), authVerify, resetPass);

  // to be eligible for streaming;
  authRouter.post("/verifyOtp", authVerify, verifyOTP);
  authRouter.post("/sendOtp", authVerify, sendOTP);
  authRouter.post("/verified", authVerify, isVerified);

  return authRouter;
};
