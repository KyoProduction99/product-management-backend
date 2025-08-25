import { Entity, PrimaryKey, Property, Enum } from "@mikro-orm/core";
import { v4 } from "uuid";

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

@Entity()
export class User {
  @PrimaryKey()
  id: string = v4();

  @Property()
  email!: string;

  @Property()
  password!: string;

  @Property()
  name!: string;

  @Enum(() => UserRole)
  role: UserRole = UserRole.USER;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
