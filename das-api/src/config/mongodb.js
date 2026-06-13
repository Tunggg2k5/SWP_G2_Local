import mongoose from "mongoose";
import { env } from "./environment.js";

export async function connectMongoDB(uri = env.MONGODB_URI) {
  if (!uri) {
    throw new Error("Missing MongoDB connection string.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000
  });
  return mongoose.connection;
}
