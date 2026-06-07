import mongoose from "mongoose";

export const dbConnect = async () => {
  const url = process.env.MONGODB_URL?.trim();

  if (!url) {
    console.error("MONGODB_URL not provided or empty");
    return;
  }

  try {
    console.log("Connecting to MongoDB ");
    await mongoose.connect(`${url}/istream`);
    console.log("🔌 MongoDB connected successfully");
  } catch (err: any) {
    console.error(" MongoDB connection failed:", err.message);
  }
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
