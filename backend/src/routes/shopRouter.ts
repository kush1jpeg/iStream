import { Router } from "express";
import { createOrder } from "../controller/payment/shop/createOrder";
import { authVerify } from "../middlewares/jwtVerify";
import { verifyPayment } from "../controller/payment/shop/verifyCallback";
import { getShopHomepage } from "../controller/shop/getAll";
import { searchShop } from "../controller/shop/search";

export const shopRouter: Router = Router();

shopRouter.post("/create-order", authVerify, createOrder);
shopRouter.post("/verify-payment", verifyPayment);

shopRouter.get("/search", searchShop);
shopRouter.get("/getAll", getShopHomepage);
