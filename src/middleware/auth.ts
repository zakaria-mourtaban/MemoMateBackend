import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/User";

interface JwtPayload {
	id: string;
}
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
	namespace Express {
		interface Request {
			user?: IUser;
		}
	}
}
/* eslint-enable @typescript-eslint/no-namespace */
export const protect = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	let token: string | undefined;

	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith("Bearer")
	) {
		try {
			token = req.headers.authorization.split(" ")[1];
			const decoded = jwt.verify(
				token,
				process.env.JWT_SECRET || ""
			) as JwtPayload;

			const user = await User.findById(decoded.id).select("-password");
			if (user && !user.banned) {
				user.lastLogin = new Date();
				await user.save();
				req.user = user;
				next();
			} else {
				res.status(403).json({
					message: "User is banned or not authorized",
				});
			}
		} catch (error) {
			res.status(401).json({ message: "Not authorized, token failed" });
		}
	} else {
		res.status(401).json({ message: "Not authorized, no token" });
	}
};
