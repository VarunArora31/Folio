import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Create a Neon HTTP client (works in serverless/edge environments)
const sql = neon(process.env.DATABASE_URL!);

// Create Drizzle instance with our schema for type-safe queries
export const db = drizzle(sql, { schema });
