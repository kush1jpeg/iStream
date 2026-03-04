import { Router } from "express";
import { createOrder } from "../controller/payment/shop/createOrder";
import { authVerify } from "../middlewares/jwtVerify";
import { verifyPayment } from "../controller/payment/shop/verifyCallback";

export const shopRouter: Router = Router();

shopRouter.post("/createOrderIntent", authVerify, createOrder);
shopRouter.post("/rzp/callback", verifyPayment);
