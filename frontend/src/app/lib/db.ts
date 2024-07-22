// // lib/db.ts
// import { Pool, Client} from 'pg';
// // import { createClient } from '@vercel/postgres'

// // console.log("process.env.DATABASE_URL: ", process.env.DATABASE_URL)

// export const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// export const client = new Client({
//   connectionString: process.env.DATABASE_URL,
// });

// // export const vercelClient = createClient({
// //   connectionString: process.env.DATABASE_URL
// // })

// //  export const sql = vercelClient.sql

// db.js
import postgres from "postgres"

const sql = postgres({
  host: process.env.DATABASE_HOST,
  port: 5432,
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  // ssl: "require",
}) // will use psql environment variables

export default sql
