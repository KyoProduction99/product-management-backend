import { Request, Response } from "express";
import { EntityManager } from "@mikro-orm/core";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthController } from "../../src/controllers/auth.controller";
import { User, UserRole } from "../../src/entities/user.entity";

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

const mockEntityManager = {
  findOne: jest.fn(),
} as unknown as jest.Mocked<EntityManager>;

const mockRequest = (body: any = {}) =>
  ({
    body,
  } as Request);

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("AuthController", () => {
  let authController: AuthController;
  let req: Request;
  let res: Response;

  const originalEnv = process.env;

  beforeEach(() => {
    authController = new AuthController(mockEntityManager);
    res = mockResponse();
    jest.clearAllMocks();

    process.env = { ...originalEnv, JWT_SECRET: "test-secret" };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("login", () => {
    const validLoginData = {
      email: "admin@example.com",
      password: "password123",
    };

    const mockUser = {
      id: "user-1",
      email: "admin@example.com",
      password: "$2a$10$hashedPassword",
      name: "Admin",
      role: UserRole.ADMIN,
    } as User;

    beforeEach(() => {
      req = mockRequest(validLoginData);
    });

    it("should login successfully with valid credentials", async () => {
      const mockToken = "mock-jwt-token";

      mockEntityManager.findOne.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue(mockToken as never);

      await authController.login(req, res);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, {
        email: validLoginData.email,
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        validLoginData.password,
        mockUser.password
      );
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, role: mockUser.role },
        "test-secret",
        { expiresIn: "24h" }
      );

      expect(res.json).toHaveBeenCalledWith({
        message: "Login successful",
        token: mockToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
        },
      });
    });

    it("should return error when user not found", async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await authController.login(req, res);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, {
        email: validLoginData.email,
      });
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwt.sign).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid credentials",
      });
    });

    it("should return error when password is invalid", async () => {
      mockEntityManager.findOne.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await authController.login(req, res);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, {
        email: validLoginData.email,
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        validLoginData.password,
        mockUser.password
      );
      expect(mockJwt.sign).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid credentials",
      });
    });

    it("should handle missing email", async () => {
      req = mockRequest({ password: "password123" });

      await authController.login(req, res);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, {
        email: undefined,
      });
    });

    it("should handle missing password", async () => {
      req = mockRequest({ email: "admin@example.com" });
      mockEntityManager.findOne.mockResolvedValue(mockUser);

      await authController.login(req, res);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        undefined,
        mockUser.password
      );
    });

    it("should use default JWT secret when not provided", async () => {
      delete process.env.JWT_SECRET;
      const mockToken = "mock-jwt-token";

      mockEntityManager.findOne.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue(mockToken as never);

      await authController.login(req, res);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, role: mockUser.role },
        "secret",
        { expiresIn: "24h" }
      );
    });

    it("should handle database errors", async () => {
      mockEntityManager.findOne.mockRejectedValue(new Error("Database error"));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: expect.any(Error),
      });
    });

    it("should handle bcrypt errors", async () => {
      mockEntityManager.findOne.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockRejectedValue(new Error("Bcrypt error") as never);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: expect.any(Error),
      });
    });

    it("should handle JWT signing errors", async () => {
      mockEntityManager.findOne.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockImplementation(() => {
        throw new Error("JWT error");
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: expect.any(Error),
      });
    });
  });
});
