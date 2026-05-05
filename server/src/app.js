import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes/redditRoutes.js";
import { logger } from "./utils/logger.js";

const app = express();

/**
 * Middleware
 */
app.use(helmet());
app.use(express.json());

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

/**
 * Routes
 */
app.use("/", routes);

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: err.stack
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

export default app;