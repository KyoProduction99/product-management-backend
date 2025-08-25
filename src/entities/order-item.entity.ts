import { Entity, PrimaryKey, Property, ManyToOne } from "@mikro-orm/core";
import { v4 } from "uuid";
import { Order } from "./order.entity";
import { Product } from "./product.entity";

@Entity()
export class OrderItem {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => Order)
  order!: Order;

  @ManyToOne(() => Product)
  product!: Product;

  @Property()
  quantity!: number;

  @Property()
  price!: number;

  @Property()
  createdAt: Date = new Date();
}
