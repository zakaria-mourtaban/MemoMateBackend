import express, { Application } from "express";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/auth";

dotenv.config();
connectDB();

const app: Application = express();
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: "Not Found" });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(500).json({ message: err.message });
});

export default app;
