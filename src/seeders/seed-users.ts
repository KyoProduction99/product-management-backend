import { EntityManager } from "@mikro-orm/core";
import bcrypt from "bcryptjs";
import { User, UserRole } from "../entities/user.entity";

export async function seedUsers(em: EntityManager) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@admin.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "password123";

  const adminExists = await em.findOne(User, {
    email: adminEmail,
  });

  if (adminExists) {
    console.log("Admin already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = new User();
  admin.email = adminEmail;
  admin.password = hashedPassword;
  admin.name = "Admin";
  admin.role = UserRole.ADMIN;

  em.persist(admin);
  console.log("Admin created successfully!");
}
