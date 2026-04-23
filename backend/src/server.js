require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const securityHeaders = require("./middleware/securityHeaders");
const authRateLimiter = require("./middleware/authRateLimiter");

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Connect DB
connectDB();

// Middleware
app.disable("x-powered-by");
app.use(securityHeaders);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "100kb" }));

// Routes
app.use("/api/auth", authRateLimiter, require("./routes/authRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/items", require("./routes/itemRoute"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/admin-activity", require("./routes/adminActivityRoutes"));
app.use("/api/setup", require("./routes/setupRoutes"));

// Server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
