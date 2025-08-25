import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "../entities/user.entity";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secret",
    (error: any, user: any) => {
      if (error) {
        return res.status(403).json({ message: "Invalid token" });
      }
      req.user = user;
      next();
    }
  );
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
