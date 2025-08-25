import { MikroORM } from "@mikro-orm/core";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";

import config from "./config/database.config";
import { uploadImage } from "./middleware/upload.middleware";
import { authenticateToken, requireAdmin } from "./middleware/auth.middleware";
import { AuthController } from "./controllers/auth.controller";
import { ProductController } from "./controllers/product.controller";
import { OrderController } from "./controllers/order.controller";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api", limiter);

async function startServer() {
  try {
    const orm = await MikroORM.init(config);
    const generator = orm.getSchemaGenerator();
    await generator.updateSchema();

    const em = orm.em.fork();

    const authController = new AuthController(em);
    const productController = new ProductController(em);
    const orderController = new OrderController(em);

    app.post("/api/auth/login", (req, res) => authController.login(req, res));

    app.get("/api/products", (req, res) =>
      productController.getAllProducts(req, res)
    );
    app.get("/api/products/:id", (req, res) =>
      productController.getProductById(req, res)
    );
    app.post(
      "/api/products",
      authenticateToken,
      requireAdmin,
      uploadImage.single("image"),
      (req, res) => productController.createProduct(req, res)
    );
    app.put(
      "/api/products/:id",
      authenticateToken,
      requireAdmin,
      uploadImage.single("image"),
      (req, res) => productController.updateProduct(req, res)
    );
    app.delete(
      "/api/products/:id",
      authenticateToken,
      requireAdmin,
      (req, res) => productController.deleteProduct(req, res)
    );

    app.post("/api/orders", (req, res) =>
      orderController.createOrder(req, res)
    );
    app.get("/api/orders", authenticateToken, requireAdmin, (req, res) =>
      orderController.getAllOrders(req, res)
    );
    app.get("/api/orders/:id", (req, res) =>
      orderController.getOrderById(req, res)
    );
    app.put(
      "/api/orders/:id/status",
      authenticateToken,
      requireAdmin,
      (req, res) => orderController.updateOrderStatus(req, res)
    );

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
