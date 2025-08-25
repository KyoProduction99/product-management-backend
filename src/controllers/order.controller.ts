import { Request, Response } from "express";
import { EntityManager } from "@mikro-orm/core";
import { Order } from "../entities/order.entity";
import { OrderItem } from "../entities/order-item.entity";
import { Product } from "../entities/product.entity";

export class OrderController {
  constructor(private em: EntityManager) {}

  async createOrder(req: Request, res: Response) {
    const { name, email, contact, address, zipCode, city, state, items } =
      req.body;

    try {
      if (!items || items.length === 0) {
        throw new Error("Shopping cart is empty");
      }

      await this.em.transactional(async (em) => {
        const order = new Order();
        order.name = name;
        order.email = email;
        order.contact = contact;
        order.address = address;
        order.zipCode = zipCode;
        order.city = city;
        order.state = state;
        order.totalAmount = 0;

        let totalAmount = 0;

        for (const item of items) {
          const product = await em.findOne(Product, { id: item.productId });

          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          if (product.stock === 0) {
            throw new Error(`Out of stock for product ${product.name}`);
          }

          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product ${product.name}`);
          }

          const orderItem = new OrderItem();
          orderItem.order = order;
          orderItem.product = product;
          orderItem.quantity = item.quantity;
          orderItem.price = product.price;

          totalAmount += product.price * item.quantity;

          product.stock -= item.quantity;
          em.persist(orderItem);
          em.persist(product);
        }

        order.totalAmount = totalAmount;
        await em.persistAndFlush(order);

        res.status(201).json({
          message: "Order created successfully",
          order: {
            id: order.id,
            totalAmount: order.totalAmount,
            status: order.status,
          },
        });
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Server error",
        error,
      });
    }
  }

  async getAllOrders(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        id,
        name,
        email,
        sortField,
        sortOrder,
      } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const payload: any = {};
      if (id) payload.id = { $ilike: `%${id}%` };
      if (name) payload.name = { $ilike: `%${name}%` };
      if (email) payload.email = { $ilike: `%${email}%` };
      if (status) payload.status = status;

      const sortFieldStr =
        typeof sortField === "string" ? sortField : "createdAt";
      const sortOrderStr = sortOrder === "ASC" ? "ASC" : "DESC";

      const [orders, total] = await this.em.findAndCount(Order, payload, {
        populate: ["items", "items.product"],
        limit: Number(limit),
        offset,
        orderBy: { [sortFieldStr]: sortOrderStr },
      });

      res.json({
        orders,
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

  async getOrderById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const order = await this.em.findOne(Order, { id });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  }

  async updateOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await this.em.findOne(Order, { id });
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.status = status;
      await this.em.persistAndFlush(order);

      res.json({ message: "Order status updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  }
}
