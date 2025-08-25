import { MikroORM } from "@mikro-orm/core";
import config from "../config/database.config";

import { seedUsers } from "./seed-users";
import { seedProducts } from "./seed-products";

(async () => {
  const orm = await MikroORM.init(config);
  const generator = orm.getSchemaGenerator();
  await generator.updateSchema();

  const em = orm.em.fork();

  await seedUsers(em);
  await seedProducts(em);

  await em.flush();
  await orm.close(true);

  console.log("Database seeding complete.");
})();
