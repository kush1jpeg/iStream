import mongoose, { mongo } from "mongoose";
const url = process.env.MONGODB_URL;

mongoose.connection.on("connected", () => console.log("mongoDB connected"));
export const dbConnect = async () => {
  if (!url) return console.log("MONGODB_URL not provided");
  await mongoose.connect(url + "/istream");
};
