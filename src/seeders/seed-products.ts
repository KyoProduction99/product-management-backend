import { EntityManager } from "@mikro-orm/core";
import { Product } from "../entities/product.entity";

export async function seedProducts(em: EntityManager) {
  const sampleProducts = [
    {
      name: 'MacBook Pro 16"',
      category: "Electronics",
      price: 2499.99,
      stock: 10,
      description:
        "Apple MacBook Pro 16-inch with M2 Pro chip, 16GB RAM, 512GB SSD. Perfect for professional work and creative tasks.",
      isActive: true,
    },
    {
      name: "iPhone 15 Pro",
      category: "Electronics",
      price: 999.99,
      stock: 25,
      description:
        "Latest iPhone 15 Pro with A17 Pro chip, 128GB storage, Pro camera system with 3x optical zoom.",
      isActive: true,
    },
    {
      name: "The Complete Guide to Node.js",
      category: "Books",
      price: 49.99,
      stock: 50,
      description:
        "Comprehensive guide to Node.js development covering fundamentals to advanced topics including Express, databases, and deployment.",
      isActive: true,
    },
    {
      name: "Wireless Bluetooth Headphones",
      category: "Electronics",
      price: 199.99,
      stock: 30,
      description:
        "Premium wireless headphones with active noise cancellation, 30-hour battery life, and superior sound quality.",
      isActive: true,
    },
    {
      name: "JavaScript: The Definitive Guide",
      category: "Books",
      price: 59.99,
      stock: 20,
      description:
        "The comprehensive reference and guide to JavaScript, covering ES2020 and beyond. Essential for web developers.",
      isActive: true,
    },
    {
      name: "Gaming Mechanical Keyboard",
      category: "Electronics",
      price: 149.99,
      stock: 15,
      description:
        "RGB backlit mechanical gaming keyboard with blue switches, programmable keys, and aluminum frame.",
      isActive: true,
    },
    {
      name: "Discontinued Product",
      category: "Electronics",
      price: 99.99,
      stock: 0,
      description: "This product is no longer available.",
      isActive: false,
    },
  ];

  for (const data of sampleProducts) {
    const product = new Product();
    product.name = data.name;
    product.category = data.category;
    product.price = data.price;
    product.stock = data.stock;
    product.description = data.description;
    product.isActive = data.isActive;
    em.persist(product);
  }

  console.log("Sample products created successfully!");
}
