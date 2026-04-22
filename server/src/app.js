import express from "express";
import cors from "cors";
import routes from "./routes/index.js";

const app = express();

/**
 * Middleware
 */
app.use(express.json());

app.use(cors({
  origin: "*", // restrict in production
}));

/**
 * Routes
 */
app.use("/api", routes);

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

export default app;