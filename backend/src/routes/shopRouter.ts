import { Router } from "express";
import { createIntent } from "../controller/payment/createOrder";
import { authVerify } from "../middlewares/jwtVerify";

export const shopRouter: Router = Router();

shopRouter.post("/createOrderIntent", authVerify, createIntent);
