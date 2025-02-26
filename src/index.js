import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import routes from "./routers/index.js"; // Import the routes index

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/chatbot";

// Middleware
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Use routes
app.use("/api", routes); // Use the aggregated routes

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
