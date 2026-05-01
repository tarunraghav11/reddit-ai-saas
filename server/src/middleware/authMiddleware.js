import { supabase } from "../config/supabase.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid Authorization header"
      });
    }

    const token = authHeader.split(" ")[1];

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    req.user = data.user;

    next();
  } catch (err) {
    console.error("[Auth Middleware] Error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }
};