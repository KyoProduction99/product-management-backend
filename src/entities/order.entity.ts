import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  Collection,
  Enum,
} from "@mikro-orm/core";
import { v4 } from "uuid";
import { OrderItem } from "./order-item.entity";

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

@Entity()
export class Order {
  @PrimaryKey()
  id: string = v4();

  @Property()
  name!: string;

  @Property()
  email!: string;

  @Property()
  contact!: string;

  @Property()
  address!: string;

  @Property()
  zipCode!: string;

  @Property()
  city!: string;

  @Property()
  state!: string;

  @Property()
  totalAmount!: number;

  @Enum(() => OrderStatus)
  status: OrderStatus = OrderStatus.PENDING;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  items = new Collection<OrderItem>(this);
}
