import { Router } from "express";
import { initiateTransactionApi } from "../controller/shop/initiateTransactionApi";

export const shopRouter: Router = Router();

shopRouter.post("paytm/initiateTransaction", initiateTransactionApi);
