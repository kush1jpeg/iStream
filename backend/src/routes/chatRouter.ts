import { Router } from "express";
import { authVerify } from "../middlewares/jwtVerify";
import { getAllConversations } from "../controller/chat/getAllConversations";
import { getConversationMessages } from "../controller/chat/getConvo";
import { getSuggestions } from "../controller/chat/getSuggestions";
import { createConvo } from "../controller/chat/create";
import { deleteConvo } from "../controller/chat/deleteConvo";

export const chatRouter: Router = Router();

chatRouter.get("/convo/all", authVerify, getAllConversations);
chatRouter.get("/get/convo", authVerify, getConversationMessages);
chatRouter.get("/suggest", authVerify, getSuggestions);
chatRouter.post("/create/convo", authVerify, createConvo);
chatRouter.post("/delete/convo/:conversationKey", authVerify, deleteConvo);
