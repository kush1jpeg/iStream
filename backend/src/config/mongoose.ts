import mongoose from "mongoose";

export const dbConnect = async (retries = 6, delay = 3000) => {
  const url = process.env.MONGODB_URL?.trim();

  if (!url) {
    console.error("MONGODB_URL not provided or empty");
    return;
  }
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(url);
      console.log("✅ MongoDB connected");
      return;
    } catch (err: any) {
      console.error(`MongoDB attempt ${i + 1} failed: ${err.message}`);
      if (i < retries - 1) await new Promise((r) => setTimeout(r, delay));
    }
  }
  console.error("❌ MongoDB connection failed after all retries");
  process.exit(1);
};

export const mongoStatus = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  } as const;

  return {
    connected: mongoose.connection.readyState === 1,
    state:
      states[mongoose.connection.readyState as keyof typeof states] ??
      "unknown",
  };
};

/*
  {
  "mongoDB": {
    "connected": true,
    "state": "connected"
  }
}
*/
