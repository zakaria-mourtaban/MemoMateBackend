import express, { Application } from "express";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/auth";

dotenv.config();
connectDB();

const app: Application = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: "Not Found" });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
	console.error("Error occurred:", err);          // Log the error object
	console.error("Stack trace:", err.stack);       // Log the full stack trace
  
	// Send a response back to the client
	res.status(500).json({
	  message: err.message,                         // Show the error message to the client
	  stack: process.env.ENV === 'development' ? err.stack : undefined // Optional: Show stack in development only
	});
  });

export default app;
