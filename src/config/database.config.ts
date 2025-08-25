import { Options } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import dotenv from "dotenv";

dotenv.config();

const config: Options<PostgreSqlDriver> = {
  driver: PostgreSqlDriver,
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  dbName: process.env.DB_NAME || "product_management",
  entities: ["./dist/entities/**/*.entity.js"],
  entitiesTs: ["./src/entities/**/*.entity.ts"],
  debug: process.env.NODE_ENV === "development",
  allowGlobalContext: true,
};

export default config;
