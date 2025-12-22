import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.PGUSER || "postgres",
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "Personal_Web",
  password: process.env.PGPASSWORD || "wipaing123",
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

export default pool;
export { pool };
