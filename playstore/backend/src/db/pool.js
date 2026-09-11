import { Pool } from "pg";;



// const pool = new Pool({
//   host: process.env.PGHOST,
//   port: process.env.PGPORT,
//   database: process.env.PGDATABASE,
//   user: process.env.PGUSER,
//   password: process.env.PGPASSWORD,
//   max: 10,                     
//   idleTimeoutMillis: 30000,    
//   connectionTimeoutMillis: 5000
// });

const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
    connectionString:"postgres://Sethupathi:Sethu%40123@localhost:5433/postgres",
});

export default pool;