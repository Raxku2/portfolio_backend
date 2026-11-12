import express from "express";
import portfolioRouter from "./routes/portfolioRouter.js";
import { connectDB } from "./config/db.js";
import cors from "cors";
import { authRouter } from "./routes/authRouter.js";
import cookieParser from "cookie-parser";
import { messageRouter } from "./routes/messageRouter.js";
import projectRouter from "./routes/projectRouter.js";
import imagekitRouter from "./routes/imagekitRouter.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use("/portfolio", portfolioRouter);
app.use("/auth", authRouter);
app.use("/message", messageRouter);
app.use("/projects", projectRouter);
app.use("/imagekit", imagekitRouter);

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
  app.listen(8001);
} catch (error) {
  console.error("Failed to connect to MongoDB:", error.message);
  process.exit(1);
}
