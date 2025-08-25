import { Request, Response } from "express";
import { EntityManager } from "@mikro-orm/core";
import { OrderController } from "../../src/controllers/order.controller";
import { Order, OrderStatus } from "../../src/entities/order.entity";
import { Product } from "../../src/entities/product.entity";

const mockEntityManager = {
  transactional: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  persist: jest.fn(),
  persistAndFlush: jest.fn(),
} as unknown as jest.Mocked<EntityManager>;

const mockRequest = (body: any = {}, params: any = {}, query: any = {}) =>
  ({
    body,
    params,
    query,
  } as Request);

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("OrderController", () => {
  let orderController: OrderController;
  let req: Request;
  let res: Response;

  beforeEach(() => {
    orderController = new OrderController(mockEntityManager);
    jest.clearAllMocks();
  });

  describe("createOrder", () => {
    const validOrderData = {
      name: "Customer",
      email: "customer@example.com",
      contact: "1234567890",
      address: "123 Address",
      zipCode: "12345",
      city: "City",
      state: "State",
      items: [
        {
          productId: "product-1",
          quantity: 2,
        },
        {
          productId: "product-2",
          quantity: 1,
        },
      ],
    };

    const mockProduct1 = {
      id: "product-1",
      name: "Product 1",
      price: 100,
      stock: 10,
    } as Product;

    const mockProduct2 = {
      id: "product-2",
      name: "Product 2",
      price: 50,
      stock: 5,
    } as Product;

    beforeEach(() => {
      req = mockRequest(validOrderData);
      res = mockResponse();
    });

    it("should create order successfully", async () => {
      const mockTransactional = jest
        .fn()
        .mockImplementation(async (callback) => {
          const mockEm = {
            findOne: jest
              .fn()
              .mockResolvedValueOnce(mockProduct1)
              .mockResolvedValueOnce(mockProduct2),
            persist: jest.fn(),
            persistAndFlush: jest.fn(),
          };
          return callback(mockEm);
        });

      mockEntityManager.transactional = mockTransactional;

      await orderController.createOrder(req, res);

      expect(mockTransactional).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Order created successfully",
        order: {
          id: expect.any(String),
          totalAmount: 250,
          status: OrderStatus.PENDING,
        },
      });
    });

    it("should return error when cart is empty", async () => {
      req = mockRequest({ ...validOrderData, items: [] });

      await orderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Shopping cart is empty",
        error: expect.any(Error),
      });
    });

    it("should return error when items array is missing", async () => {
      req = mockRequest({ ...validOrderData, items: undefined });

      await orderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Shopping cart is empty",
        error: expect.any(Error),
      });
    });

    it("should return error when product not found", async () => {
      const mockTransactional = jest
        .fn()
        .mockImplementation(async (callback) => {
          const mockEm = {
            findOne: jest.fn().mockResolvedValue(null),
          };
          return callback(mockEm);
        });

      mockEntityManager.transactional = mockTransactional;

      await orderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Product product-1 not found",
        error: expect.any(Error),
      });
    });

    it("should return error when product is out of stock", async () => {
      const outOfStockProduct = { ...mockProduct1, stock: 0 };

      const mockTransactional = jest
        .fn()
        .mockImplementation(async (callback) => {
          const mockEm = {
            findOne: jest.fn().mockResolvedValue(outOfStockProduct),
          };
          return callback(mockEm);
        });

      mockEntityManager.transactional = mockTransactional;

      await orderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Out of stock for product Product 1",
        error: expect.any(Error),
      });
    });

    it("should return error when insufficient stock", async () => {
      const lowStockProduct = { ...mockProduct1, stock: 1 };

      const mockTransactional = jest
        .fn()
        .mockImplementation(async (callback) => {
          const mockEm = {
            findOne: jest.fn().mockResolvedValue(lowStockProduct),
          };
          return callback(mockEm);
        });

      mockEntityManager.transactional = mockTransactional;

      await orderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Insufficient stock for product Product 1",
        error: expect.any(Error),
      });
    });

    it("should handle database errors", async () => {
      mockEntityManager.transactional.mockRejectedValue(
        new Error("Database error")
      );

      await orderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Database error",
        error: expect.any(Error),
      });
    });
  });

  describe("getAllOrders", () => {
    const mockOrders = [
      {
        id: "order-1",
        name: "Customer 1",
        email: "customer1@example.com",
        status: OrderStatus.PENDING,
        createdAt: new Date(),
      },
      {
        id: "order-2",
        name: "Customer 2",
        email: "customer2@example.com",
        status: OrderStatus.CONFIRMED,
        createdAt: new Date(),
      },
    ] as Order[];

    beforeEach(() => {
      res = mockResponse();
    });

    it("should get all orders with default pagination", async () => {
      req = mockRequest({}, {}, {});
      mockEntityManager.findAndCount.mockResolvedValue([mockOrders, 2]);

      await orderController.getAllOrders(req, res);

      expect(mockEntityManager.findAndCount).toHaveBeenCalledWith(
        Order,
        {},
        {
          populate: ["items", "items.product"],
          limit: 10,
          offset: 0,
          orderBy: { createdAt: "DESC" },
        }
      );

      expect(res.json).toHaveBeenCalledWith({
        orders: mockOrders,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pages: 1,
        },
      });
    });

    it("should get orders with custom pagination", async () => {
      req = mockRequest({}, {}, { page: "2", limit: "5" });
      mockEntityManager.findAndCount.mockResolvedValue([mockOrders, 10]);

      await orderController.getAllOrders(req, res);

      expect(mockEntityManager.findAndCount).toHaveBeenCalledWith(
        Order,
        {},
        {
          populate: ["items", "items.product"],
          limit: 5,
          offset: 5,
          orderBy: { createdAt: "DESC" },
        }
      );

      expect(res.json).toHaveBeenCalledWith({
        orders: mockOrders,
        pagination: {
          page: 2,
          limit: 5,
          total: 10,
          pages: 2,
        },
      });
    });

    it("should filter orders by status", async () => {
      req = mockRequest({}, {}, { status: "pending" });
      mockEntityManager.findAndCount.mockResolvedValue([mockOrders, 1]);

      await orderController.getAllOrders(req, res);

      expect(mockEntityManager.findAndCount).toHaveBeenCalledWith(
        Order,
        { status: "pending" },
        expect.any(Object)
      );
    });

    it("should filter orders by name", async () => {
      req = mockRequest({}, {}, { name: "John" });
      mockEntityManager.findAndCount.mockResolvedValue([mockOrders, 1]);

      await orderController.getAllOrders(req, res);

      expect(mockEntityManager.findAndCount).toHaveBeenCalledWith(
        Order,
        { name: { $ilike: "%John%" } },
        expect.any(Object)
      );
    });

    it("should filter orders by email", async () => {
      req = mockRequest({}, {}, { email: "customer@example.com" });
      mockEntityManager.findAndCount.mockResolvedValue([mockOrders, 1]);

      await orderController.getAllOrders(req, res);

      expect(mockEntityManager.findAndCount).toHaveBeenCalledWith(
        Order,
        { email: { $ilike: "%customer@example.com%" } },
        expect.any(Object)
      );
    });

    it("should filter orders by id", async () => {
      req = mockRequest({}, {}, { id: "order-1" });
      mockEntityManager.findAndCount.mockResolvedValue([mockOrders, 1]);

      await orderController.getAllOrders(req, res);

      expect(mockEntityManager.findAndCount).toHaveBeenCalledWith(
        Order,
        { id: { $ilike: "%order-1%" } },
        expect.any(Object)
      );
    });

    it("should sort orders by custom field and order", async () => {
      req = mockRequest({}, {}, { sortField: "name", sortOrder: "ASC" });
      mockEntityManager.findAndCount.mockResolvedValue([mockOrders, 2]);

      await orderController.getAllOrders(req, res);

      expect(mockEntityManager.findAndCount).toHaveBeenCalledWith(
        Order,
        {},
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

      await orderController.getAllOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: expect.any(Error),
      });
    });
  });

  describe("getOrderById", () => {
    const mockOrder = {
      id: "order-1",
      name: "Customer",
      email: "customer@example.com",
      status: OrderStatus.PENDING,
    } as Order;

    beforeEach(() => {
      res = mockResponse();
    });

    it("should get order by id successfully", async () => {
      req = mockRequest({}, { id: "order-1" });
      mockEntityManager.findOne.mockResolvedValue(mockOrder);

      await orderController.getOrderById(req, res);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Order, {
        id: "order-1",
      });
      expect(res.json).toHaveBeenCalledWith(mockOrder);
    });

    it("should return 404 when order not found", async () => {
      req = mockRequest({}, { id: "non-existent-order" });
      mockEntityManager.findOne.mockResolvedValue(null);

      await orderController.getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Order not found" });
    });

    it("should handle database errors", async () => {
      req = mockRequest({}, { id: "order-1" });
      mockEntityManager.findOne.mockRejectedValue(new Error("Database error"));

      await orderController.getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: expect.any(Error),
      });
    });
  });

  describe("updateOrderStatus", () => {
    const mockOrder = {
      id: "order-1",
      name: "Customer",
      status: OrderStatus.PENDING,
    } as Order;

    beforeEach(() => {
      res = mockResponse();
    });

    it("should update order status successfully", async () => {
      req = mockRequest({ status: OrderStatus.CONFIRMED }, { id: "order-1" });
      mockEntityManager.findOne.mockResolvedValue(mockOrder);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      await orderController.updateOrderStatus(req, res);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Order, {
        id: "order-1",
      });
      expect(mockOrder.status).toBe(OrderStatus.CONFIRMED);
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(mockOrder);
      expect(res.json).toHaveBeenCalledWith({
        message: "Order status updated successfully",
      });
    });

    it("should return 404 when order not found", async () => {
      req = mockRequest(
        { status: OrderStatus.CONFIRMED },
        { id: "non-existent-order" }
      );
      mockEntityManager.findOne.mockResolvedValue(null);

      await orderController.updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Order not found" });
    });

    it("should handle database errors", async () => {
      req = mockRequest({ status: OrderStatus.CONFIRMED }, { id: "order-1" });
      mockEntityManager.findOne.mockRejectedValue(new Error("Database error"));

      await orderController.updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: expect.any(Error),
      });
    });

    it("should handle persistAndFlush errors", async () => {
      req = mockRequest({ status: OrderStatus.CONFIRMED }, { id: "order-1" });
      mockEntityManager.findOne.mockResolvedValue(mockOrder);
      mockEntityManager.persistAndFlush.mockRejectedValue(
        new Error("Persist error")
      );

      await orderController.updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: expect.any(Error),
      });
    });
  });
});
