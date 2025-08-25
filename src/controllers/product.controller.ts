import { Request, Response } from "express";
import { EntityManager } from "@mikro-orm/core";
import { Product } from "../entities/product.entity";
import { deleteFile } from "../middleware/upload.middleware";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export class ProductController {
  constructor(private em: EntityManager) {}

  async getAllProducts(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        ids,
        name,
        category,
        sortField,
        sortOrder,
      } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const payload: any = { isActive: true };
      if (typeof ids === "string") payload.id = { $in: ids.split(",") };
      if (name) payload.name = { $ilike: `%${name}%` };
      if (category) payload.category = category;

      const sortFieldStr =
        typeof sortField === "string" ? sortField : "createdAt";
      const sortOrderStr = sortOrder === "ASC" ? "ASC" : "DESC";

      const [products, total] = await this.em.findAndCount(Product, payload, {
        limit: Number(limit),
        offset,
        orderBy: { [sortFieldStr]: sortOrderStr },
      });

      res.json({
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  }

  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await this.em.findOne(Product, { id, isActive: true });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  }

  async createProduct(req: MulterRequest, res: Response) {
    try {
      const { name, description, price, stock, category } = req.body;

      const product = new Product();
      product.name = name;
      product.category = category;
      product.price = parseFloat(price);
      product.stock = parseInt(stock);
      product.description = description;

      if (req.file) {
        product.imagePath = req.file.path;
        product.imageUrl = `/uploads/products/${req.file.filename}`;
      }

      await this.em.persistAndFlush(product);

      res.status(201).json({ message: "Product created successfully" });
    } catch (error) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  }

  async updateProduct(req: MulterRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, price, stock, category } = req.body;

      const product = await this.em.findOne(Product, { id });
      if (!product) {
        if (req.file) {
          deleteFile(req.file.path);
        }
        return res.status(404).json({ message: "Product not found" });
      }

      if (name) product.name = name;
      if (category) product.category = category;
      if (price) product.price = parseFloat(price);
      if (stock) product.stock = parseInt(stock);
      if (description) product.description = description;

      if (req.file) {
        if (product.imagePath) {
          deleteFile(product.imagePath);
        }

        product.imagePath = req.file.path;
        product.imageUrl = `/uploads/products/${req.file.filename}`;
      }

      await this.em.persistAndFlush(product);

      res.json({ message: "Product updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const product = await this.em.findOne(Product, { id });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      product.isActive = false;
      await this.em.persistAndFlush(product);

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  }
}
