import { Router } from "express";
import { login, loginXgoogle } from "../controller/auth/login";
import { deleteAcc, logout } from "../controller/auth/logout";
import { authVerify } from "../middlewares/jwtVerify";
import {
  forgotPass,
  resetPass,
  verifyandChangePass,
} from "../controller/auth/resetPass";
import { validate } from "../middlewares/validateZOD.js";
import {
  forgotPassSchema,
  loginSchema,
  resetPassSchema,
  verifyAndChangePassSchema,
} from "../validation/authSchemas.js";
import { register } from "../controller/auth/register";
import { refreshAccessToken } from "../controller/auth/refreshTokenHandler";
import passport from "passport";
import { sendFirstStreamOTP, verifyOTP } from "../services/otp/otp";

export const authRouter = (): Router => {
  const authRouter = Router();
  authRouter.post("/register", validate(loginSchema), register);
  authRouter.post("/refresh-token", refreshAccessToken); // frontend calls /refresh-token based on some logic
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
  authRouter.post("/sendOtp", authVerify, sendFirstStreamOTP);
  authRouter.post("/verifyOtp", authVerify, verifyOTP);

  return authRouter;
};
