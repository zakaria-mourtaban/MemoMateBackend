import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import jwt, { JwtPayload } from 'jsonwebtoken';

export const adminProtect = async (
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
      if (user && user.role === 'admin') {
        req.user = user;
        next();
      } else {
        res.status(403).json({ message: "Not authorized, admin access required" });
      }
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};