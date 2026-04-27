import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error(" Missing Supabase environment variables");
  process.exit(1);
}

let supabase;

try {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        persistSession: false
      }
    }
  );
} catch (error) {
  console.error(" Failed to initialize Supabase client:", error.message);
  process.exit(1);
}

export { supabase };