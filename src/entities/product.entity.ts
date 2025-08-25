import {
  Entity,
  PrimaryKey,
  Property,
  Collection,
  OneToMany,
} from "@mikro-orm/core";
import { v4 } from "uuid";
import { OrderItem } from "./order-item.entity";

@Entity()
export class Product {
  @PrimaryKey()
  id: string = v4();

  @Property()
  name!: string;

  @Property()
  category!: string;

  @Property()
  price!: number;

  @Property()
  stock!: number;

  @Property({ columnType: "text" })
  description!: string;

  @Property({ nullable: true })
  imageUrl?: string;

  @Property({ nullable: true })
  imagePath?: string;

  @Property()
  isActive: boolean = true;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems = new Collection<OrderItem>(this);
}
