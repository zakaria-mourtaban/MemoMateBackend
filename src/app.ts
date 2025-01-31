import express, { Application } from "express";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/auth";
import workspaceRoutes from "./routes/workspace";
import chatRoutes from "./routes/chat"
import cors from "cors";
import { protect } from "./middleware/auth";


dotenv.config();
connectDB();

const app: Application = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/auth/", authRoutes);
app.use("/api/", protect, workspaceRoutes);
app.use("/api/", protect, chatRoutes)
app.use((req, res, next) => {
	res.status(404).json({ message: "Not Found" });
});

app.use(
	(
		err: Error,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		console.error("Error occurred:", err);
		console.error("Stack trace:", err.stack);

		res.status(500).json({
			message: err.message,
			stack: process.env.ENV === "development" ? err.stack : undefined,
		});
	}
);

export default app;
