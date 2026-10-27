
import mongoose from "mongoose";
import { config } from "./env.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      `✅ MongoDB Connected: ${mongoose.connection.host}/${mongoose.connection.name}`
    );

    return true;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    return false;
  }
};

export const getDBStatus = () => {
  const states = [
    "Disconnected",
    "Connected",
    "Connecting",
    "Disconnecting",
  ];

  const stateCode = mongoose.connection.readyState;

  return {
    state: states[stateCode] || "Unknown",
    isConnected: stateCode === 1,
    host: mongoose.connection.host || null,
    database: mongoose.connection.name || null,
  };
};
