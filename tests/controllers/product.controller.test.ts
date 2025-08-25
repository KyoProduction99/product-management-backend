import { Request, Response } from "express";
import { EntityManager } from "@mikro-orm/core";
import { ProductController } from "../../src/controllers/product.controller";
import { Product } from "../../src/entities/product.entity";
import { deleteFile } from "../../src/middleware/upload.middleware";

jest.mock("../../src/middleware/upload.middleware", () => ({
  deleteFile: jest.fn(),
}));

const mockDeleteFile = deleteFile as jest.MockedFunction<typeof deleteFile>;

const mockEntityManager = {
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  persistAndFlush: jest.fn(),
} as unknown as jest.Mocked<EntityManager>;

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const mockRequest = (
  body: any = {},
  params: any = {},
  query: any = {},
  file?: Express.Multer.File
) =>
  ({
    body,
    params,
    query,
    file,
  } as MulterRequest);

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockFile: Express.Multer.File = {
  fieldname: "image",
  originalname: "test-image.jpg",
  encoding: "7bit",
  mimetype: "image/jpeg",
  size: 1024,
  destination: "uploads/products",
  filename: "1234567890-test-image.jpg",
  path: "uploads/products/1234567890-test-image.jpg",
  buffer: Buffer.from(""),
  stream: {} as any,
};

describe("ProductController", () => {
  let productController: ProductController;
  let req: MulterRequest;
  let res: Response;

  beforeEach(() => {
    productController = new ProductController(mockEntityManager);
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe("getAllProducts", () => {
    const mockProducts = [
      {
        id: "product-1",
        name: "Product 1",
        category: "Electronics",
        price: 100,
        stock: 10,
        isActive: true,
      },
      {
        id: "product-2",
        name: "Product 2",
        category: "Books",
        price: 50,
        stock: 5,
        isActive: true,
      },
    ] as Product[];

    it("should get all products with default pagination", async () => {
      req = mockRequest({}, {}, {});
      mockEntityManager.findAndCount.mockResolvedValue([mockProducts, 2]);

      await productController.getAllProducts(req, res);

      expect(mockEntityManager.findAndCount).toHaveBeenCalledWith(
        Product,
        { isActive: true },
        {
          limit: 10,
          offset: 0,
          orderBy: { createdAt: "DESC" },
        }
      );

      expect(res.json).toHaveBeenCalledWith({
        products: mockProducts,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pages: 1,
        },
      });
    });

    it("should get products with custom pagination", async () => {
      req = mockRequest({}, {}, { page: "2", limit: "5" });
      mockEntityManager.findAndCount.mockResolvedValue([mockProducts, 10]);

      await productController.getAllProducts(req, res);

      expect(mockEntityManager.findAndCount).toHaveBeenCalledWith(
        Product,
        { isActive: true },
        {
          limit: 5,
          offset: 5,
          orderBy: { createdAt: "DESC" },
        }
      );

      expect(res.json).toHaveBeenCalledWith({
        products: mockProducts,
        pagination: {
          page: 2,
          limit: 5,
          total: 10,
          pages: 2,
        },
      });
    });

    it("should filter products by name", async () => {
      req = mockRequest({}, {}, { name: "Product 1" });
      mockEntityManager.findAndCount.mockResolvedValue([mockProducts, 1]);

      await productController.getAllProducts(req, res);

      expect(mockEntityManager.findAndCount).toHaveBeenCalledWith(
        Product,
        { isActive: true, name: { $ilike: "%Product 1%" } },
        expect.any(Object)
      );
    });

    it("should filter products by category", async () => {
      req = mockRequest({}, {}, { category: "Electronics" });
      mockEntityManager.findAndCount.mockResolvedValue([mockProducts, 1]);

      await productController.getAllProducts(req, res);

      expect(mockEntityManager.findAndCount).toHaveBeenCalledWith(
        Product,
        { isActive: true, category: "Electronics" },
        expect.any(Object)
      );
    });

    it("should filter products by ids", async () => {
      req = mockRequest({}, {}, { ids: "product-1,product-2" });
      mockEntityManager.findAndCount.mockResolvedValue([mockProducts, 2]);

      await productController.getAllProducts(req, res);

      expect(mockEntityManager.findAndCount).toHaveBeenCalledWith(
        Product,
        { isActive: true, id: { $in: ["product-1", "product-2"] } },
        expect.any(Object)
      );
    });

    it("should sort products by custom field and order", async () => {
      req = mockRequest({}, {}, { sortField: "name", sortOrder: "ASC" });
      mockEntityManager.findAndCount.mockResolvedValue([mockProducts, 2]);

      await productController.getAllProducts(req, res);

      expect(mockEntityManager.findAndCount).toHaveBeenCalledWith(
        Product,
        { isActive: true },
        expect.objectContaining({
          orderBy: { name: "ASC" },
        })
      );
    });

    it("should handle database errors", async () => {
      req = mockRequest({}, {}, {});
      mockEntityManager.findAndCount.mockRejectedValue(
        new Error("Database error")
      );

      await productController.getAllProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: expect.any(Error),
      });
    });
  });

  describe("getProductById", () => {
    const mockProduct = {
      id: "product-1",
      name: "Product 1",
      category: "Electronics",
      price: 100,
      isActive: true,
    } as Product;

    it("should get product by id successfully", async () => {
      req = mockRequest({}, { id: "product-1" });
      mockEntityManager.findOne.mockResolvedValue(mockProduct);

      await productController.getProductById(req, res);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Product, {
        id: "product-1",
        isActive: true,
      });
      expect(res.json).toHaveBeenCalledWith(mockProduct);
    });

    it("should return 404 when product not found", async () => {
      req = mockRequest({}, { id: "non-existent-product" });
      mockEntityManager.findOne.mockResolvedValue(null);

      await productController.getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Product not found" });
    });

    it("should handle database errors", async () => {
      req = mockRequest({}, { id: "product-1" });
      mockEntityManager.findOne.mockRejectedValue(new Error("Database error"));

      await productController.getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: expect.any(Error),
      });
    });
  });

  describe("createProduct", () => {
    const validProductData = {
      name: "New Product",
      description: "Product description",
      price: "99.99",
      stock: "10",
      category: "Electronics",
    };

    it("should create product successfully without image", async () => {
      req = mockRequest(validProductData);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      await productController.createProduct(req, res);

      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Product",
          description: "Product description",
          price: 99.99,
          stock: 10,
          category: "Electronics",
        })
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Product created successfully",
      });
    });

    it("should create product successfully with image", async () => {
      req = mockRequest(validProductData, {}, {}, mockFile);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      await productController.createProduct(req, res);

      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Product",
          imagePath: mockFile.path,
          imageUrl: `/uploads/products/${mockFile.filename}`,
        })
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Product created successfully",
      });
    });

    it("should handle database errors and delete uploaded file", async () => {
      req = mockRequest(validProductData, {}, {}, mockFile);
      mockEntityManager.persistAndFlush.mockRejectedValue(
        new Error("Database error")
      );

      await productController.createProduct(req, res);

      expect(mockDeleteFile).toHaveBeenCalledWith(mockFile.path);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: expect.any(Error),
      });
    });

    it("should handle errors without uploaded file", async () => {
      req = mockRequest(validProductData);
      mockEntityManager.persistAndFlush.mockRejectedValue(
        new Error("Database error")
      );

      await productController.createProduct(req, res);

      expect(mockDeleteFile).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("updateProduct", () => {
    const mockProduct = {
      id: "product-1",
      name: "Old Product",
      description: "Old description",
      price: 50,
      stock: 5,
      category: "Books",
      imagePath: "old/path/image.jpg",
      imageUrl: "/uploads/products/old-image.jpg",
    } as Product;

    const updateData = {
      name: "Updated Product",
      description: "Updated description",
      price: "99.99",
      stock: "15",
      category: "Electronics",
    };

    it("should update product successfully without new image", async () => {
      req = mockRequest(updateData, { id: "product-1" });
      mockEntityManager.findOne.mockResolvedValue(mockProduct);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      await productController.updateProduct(req, res);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Product, {
        id: "product-1",
      });
      expect(mockProduct.name).toBe("Updated Product");
      expect(mockProduct.price).toBe(99.99);
      expect(mockProduct.stock).toBe(15);
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(
        mockProduct
      );

      expect(res.json).toHaveBeenCalledWith({
        message: "Product updated successfully",
      });
    });

    it("should update product successfully with new image", async () => {
      req = mockRequest(updateData, { id: "product-1" }, {}, mockFile);
      mockEntityManager.findOne.mockResolvedValue(mockProduct);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      await productController.updateProduct(req, res);

      expect(mockDeleteFile).toHaveBeenCalledWith("old/path/image.jpg");
      expect(mockProduct.imagePath).toBe(mockFile.path);
      expect(mockProduct.imageUrl).toBe(
        `/uploads/products/${mockFile.filename}`
      );
    });

    it("should return 404 when product not found", async () => {
      req = mockRequest(updateData, { id: "non-existent-product" });
      mockEntityManager.findOne.mockResolvedValue(null);

      await productController.updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Product not found" });
    });

    it("should return 404 and delete uploaded file when product not found", async () => {
      req = mockRequest(
        updateData,
        { id: "non-existent-product" },
        {},
        mockFile
      );
      mockEntityManager.findOne.mockResolvedValue(null);

      await productController.updateProduct(req, res);

      expect(mockDeleteFile).toHaveBeenCalledWith(mockFile.path);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should handle partial updates", async () => {
      const localMockProduct = {
        id: "product-1",
        name: "Old Product",
        description: "Old description",
        price: 50,
        stock: 5,
        category: "Books",
      } as Product;

      req = mockRequest({ name: "Partially Updated" }, { id: "product-1" });
      mockEntityManager.findOne.mockResolvedValue(localMockProduct);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      await productController.updateProduct(req, res);

      expect(localMockProduct.name).toBe("Partially Updated");
      expect(localMockProduct.description).toBe("Old description");
    });

    it("should handle database errors", async () => {
      req = mockRequest(updateData, { id: "product-1" });
      mockEntityManager.findOne.mockRejectedValue(new Error("Database error"));

      await productController.updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: expect.any(Error),
      });
    });
  });

  describe("deleteProduct", () => {
    const mockProduct = {
      id: "product-1",
      name: "Product to Delete",
      isActive: true,
    } as Product;

    it("should delete product successfully (soft delete)", async () => {
      req = mockRequest({}, { id: "product-1" });
      mockEntityManager.findOne.mockResolvedValue(mockProduct);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      await productController.deleteProduct(req, res);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Product, {
        id: "product-1",
      });
      expect(mockProduct.isActive).toBe(false);
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(
        mockProduct
      );

      expect(res.json).toHaveBeenCalledWith({
        message: "Product deleted successfully",
      });
    });

    it("should return 404 when product not found", async () => {
      req = mockRequest({}, { id: "non-existent-product" });
      mockEntityManager.findOne.mockResolvedValue(null);

      await productController.deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Product not found" });
    });

    it("should handle database errors", async () => {
      req = mockRequest({}, { id: "product-1" });
      mockEntityManager.findOne.mockRejectedValue(new Error("Database error"));

      await productController.deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: expect.any(Error),
      });
    });
  });
});
