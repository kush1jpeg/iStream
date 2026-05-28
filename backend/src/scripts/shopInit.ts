import mongoose from "mongoose";
import dotenv from "dotenv";
import { shopItemModel } from "../models/item";

dotenv.config();

const shopItems = [
  // PACKS
  {
    name: "Indian Pack",
    description: "Local chaos, global energy",
    type: "stickerPack",
    price: 120,
    imageURL: "/stickers/indian_collage.png",
    active: true,
    stickers: [
      { name: "Bhau", imageURL: "/stickers/indian/bhau.gif" },
      { name: "Cry", imageURL: "/stickers/indian/cry.gif" },
      { name: "Smile", imageURL: "/stickers/indian/smile.gif" },
      { name: "Wut", imageURL: "/stickers/indian/wut-indian.gif" },
      { name: "Yaya", imageURL: "/stickers/indian/yaya.gif" },
    ],
  },

  {
    name: "AI Pack",
    description: "Synthetic minds and digital chaos",
    type: "stickerPack",
    price: 120,
    imageURL: "/stickers/AI_collage.png",
    active: true,
    stickers: [
      { name: "Cup", imageURL: "/stickers/ai/cup.gif" },
      { name: "Epstein", imageURL: "/stickers/ai/epstein.gif" },
      { name: "Folk Son", imageURL: "/stickers/ai/folk-son.gif" },
      { name: "Modi", imageURL: "/stickers/ai/modi.gif" },
      { name: "Sheen", imageURL: "/stickers/ai/sheen.gif" },
    ],
  },

  {
    name: "Anime Pack",
    description: "Emotions rendered in 24fps suffering",
    type: "stickerPack",
    price: 150,
    imageURL: "/stickers/anime_collage.png",
    active: true,
    stickers: [
      { name: "Bocchi", imageURL: "/stickers/anime/bocchi.gif" },
      { name: "Femtanyl", imageURL: "/stickers/anime/femtanyl.gif" },
      { name: "Frieren", imageURL: "/stickers/anime/frieren.gif" },
      { name: "Higuruma", imageURL: "/stickers/anime/higuruma-jjk.gif" },
      { name: "Reze", imageURL: "/stickers/anime/reze.gif" },
    ],
  },

  // =========================
  // SINGLE STICKERS
  // =========================

  {
    name: "Bocchi",
    description: "Emotions rendered in 24fps suffering",
    type: "sticker",
    price: 5,
    imageURL: "/stickers/anime/bocchi.gif",
    active: true,
  },

  {
    name: "Femtanyl",
    description: "Emotions rendered in 24fps suffering",
    type: "sticker",
    price: 10,
    imageURL: "/stickers/anime/femtanyl.gif",
    active: true,
  },

  {
    name: "Frieren",
    description: "Ancient elf, eternal depression",
    type: "sticker",
    price: 10,
    imageURL: "/stickers/anime/frieren.gif",
    active: true,
  },

  {
    name: "Higuruma",
    description: "Courtroom violence with emotional damage",
    type: "sticker",
    price: 15,
    imageURL: "/stickers/anime/higuruma-jjk.gif",
    active: true,
  },

  {
    name: "Reze",
    description: "Explosive attachment issues",
    type: "sticker",
    price: 15,
    imageURL: "/stickers/anime/reze.gif",
    active: true,
  },

  {
    name: "Hindustani Bhau",
    description: "Pure Indian internet energy",
    type: "sticker",
    price: 5,
    imageURL: "/stickers/indian/bhau.gif",
    active: true,
  },

  {
    name: "Crying",
    description: "Emotionally unstable pixels",
    type: "sticker",
    price: 5,
    imageURL: "/stickers/indian/cry.gif",
    active: true,
  },

  {
    name: "Garlic Naan",
    description: "Weaponized smiling",
    type: "sticker",
    price: 5,
    imageURL: "/stickers/indian/smile.gif",
    active: true,
  },

  {
    name: "Epstein",
    description: "Synthetic minds and digital chaos",
    type: "sticker",
    price: 10,
    imageURL: "/stickers/ai/epstein.gif",
    active: true,
  },

  {
    name: "Modi",
    description: "AI-generated governance vibes",
    type: "sticker",
    price: 5,
    imageURL: "/stickers/ai/modi.gif",
    active: true,
  },

  {
    name: "Sheen",
    description: "Maximum velocity consciousness",
    type: "sticker",
    price: 10,
    imageURL: "/stickers/ai/sheen.gif",
    active: true,
  },
];

async function seed() {
  try {
    if (!process.env.MONGODB_URL) {
      throw new Error("MONGODB_URL missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URL);

    console.log("[+] Connected to MongoDB");

    // wipe existing data
    await shopItemModel.deleteMany({});

    console.log("[+] Cleared existing shop items");

    // insert fresh data
    const inserted = await shopItemModel.insertMany(shopItems);

    console.log(`[+] Seeded ${inserted.length} shop items`);
  } catch (err) {
    console.error("[x] Seed failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("[+] MongoDB disconnected");
  }
}

seed();
