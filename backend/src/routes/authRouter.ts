import { Router } from "express";
import { register } from "../controller/register.js";
import { login } from "../controller/login.js";
import { logout } from "../controller/logout.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
