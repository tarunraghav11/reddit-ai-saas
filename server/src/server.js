import "dotenv/config.js";

import app from "./app.js";
import { logger } from "./utils/logger.js";
import "./jobs/discoverWorker.js";
import "./jobs/cleanupJob.js";

const PORT = process.env.PORT || 5000;

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err);
  process.exit(1);
});

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});