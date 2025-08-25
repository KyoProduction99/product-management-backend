import { Request, Response } from "express";
import { EntityManager } from "@mikro-orm/core";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../entities/user.entity";

export class AuthController {
  constructor(private em: EntityManager) {}

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await this.em.findOne(User, { email });
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "24h" }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  }
}
