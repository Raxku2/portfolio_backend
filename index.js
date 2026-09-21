import express from "express";
import portfolioRouter from "./routes/portfolioRouter.js";
import { connectDB } from "./config/db.js";
import cors from "cors";
import { authRouter } from "./routes/authRouter.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(cookieParser());

app.use("/portfolio", portfolioRouter);
app.use("/auth", authRouter);

app.get("/", (req, res) => {
  res.send("ok");
});

app.get("/health", (req, res) => {
  res.json({
    message: "API OK",
    Author: "Rakesh",
    Description: "My Portfolio Baackend API",
  });
});

try {
  console.log("Attempting to connect to database...");
  await connectDB();

  // 2. Only start listening for requests if the DB connected successfully
  app.listen(8001);
} catch (error) {
  // 3. If the DB fails to connect, log the error and don't start the server
  console.error("Failed to connect to MongoDB:", error.message);
  process.exit(1);
}
