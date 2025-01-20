import { Router, Request, Response, NextFunction } from "express";
import multer, { StorageEngine, FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";

// Define the upload directory
const uploadDir = path.join(__dirname, "../uploads");

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure the storage engine for Multer
const storage: StorageEngine = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		// Generate a unique filename using a timestamp and a random number
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		cb(
			null,
			`${file.fieldname}-${uniqueSuffix}${path.extname(
				file.originalname
			)}`
		);
	},
});

// Define file filters to restrict uploaded file types
const fileFilter = (
	req: Request,
	file: Express.Multer.File,
	cb: FileFilterCallback
): void => {
	const allowedFileTypes = /pdf|docx|excalidraw/; // Allowed file extensions
	const extname = allowedFileTypes.test(
		path.extname(file.originalname).toLowerCase()
	); // Check extension
	const mimetype = allowedFileTypes.test(file.mimetype); // Check MIME type

	if (extname && mimetype) {
		cb(null, true); // Accept the file
	} else {
		cb(new Error("Only pdf, docx, and excalidraw files are allowed!")); // Reject the file
	}
};

// Create the Multer instance
const upload = multer({
	storage,
	limits: { fileSize: 30 * 1024 * 1024 }, 
	fileFilter,
});

// Create a new Express router
const uploadRouter: Router = Router();

uploadRouter.post(
	"/upload",
	upload.single("file"), 
	(req: Request, res: Response, next: NextFunction): void => {
		if (!req.file) {
			res.status(400).send("No file uploaded."); 
			return;
		}

		res.status(200).send({
			message: "File uploaded successfully!",
			file: req.file,
		});
	}
);

// Export the router
export default uploadRouter;
