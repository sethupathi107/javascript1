// import { Sequelize, importModels } from '@sequelize/core';
// import { PostgresDialect } from '@sequelize/postgres';
// import env from "dotenv";
// import { fileURLToPath } from 'url';
// env.config();

const sequelize = new Sequelize({
  dialect: PostgresDialect,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
 });

// await sequelize.authenticate();
// console.log(Object.keys(sequelize.models));

// export default sequelize;



import { Sequelize } from '@sequelize/core';
import { PostgresDialect } from '@sequelize/postgres';

import defineUser from "../models/User.js";
import defineCategory from "../models/Category.js";
import defineApplication from "../models/App.js";
import defineInstalled from "../models/Installed.js";
import defineSession from "../models/Session.js";

// const sequelize = new Sequelize({
//   dialect: PostgresDialect,
//   url: process.env.DATABASE_URL,
// });

const User = defineUser(sequelize);
const Category = defineCategory(sequelize);
const Application = defineApplication(sequelize, { User, Category });
const Installed = defineInstalled(sequelize, { User, Application });
const Session = defineSession(sequelize, { User });

const models = { User, Category, Application, Installed, Session };

Object.values(models).forEach((model) => {
  if (model.associate) model.associate(models);
});

await sequelize.authenticate();

export default sequelize;
export { User, Category, Application, Installed, Session };
