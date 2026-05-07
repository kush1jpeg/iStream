import { Router } from "express";
import { createOrder } from "../controller/payment/shop/createOrder";
import { authVerify } from "../middlewares/jwtVerify";
import { verifyPayment } from "../controller/payment/shop/verifyCallback";
import { searchShopItems } from "../controller/payment/shop/searchItem";
import { getShopHomepage } from "../controller/payment/shop/home";

export const shopRouter: Router = Router();

shopRouter.post("/createOrderIntent", authVerify, createOrder);
shopRouter.post("/rzp/callback", verifyPayment);

shopRouter.post("/search", searchShopItems);
shopRouter.get("/", getShopHomepage);
