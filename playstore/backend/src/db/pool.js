import { Pool } from "pg";
// const pool = new Pool({
//   host: process.env.PGHOST,
//   port: process.env.PGPORT,
//   database: process.env.PGDATABASE,
//   user: process.env.PGUSER,
//   password: process.env.PGPASSWORD,
//   max: 10,                     
//   idleTimeoutMillis: 30000,    
//   connectionTimeoutMi  llis: 5000
// });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;