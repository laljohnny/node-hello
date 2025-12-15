const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const generateUploadUrlHandler = require("./actions/generate-upload-url");
const confirmUploadHandler = require("./actions/confirm-upload");
const deleteFileHandler = require("./actions/delete-file");
const getFileHandler = require("./actions/get-file");
const updateFileHandler = require("./actions/update-file");

const { authenticateToken } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "file-service" });
});

// Action endpoints
app.post(
  "/files/generate-upload-url",
  authenticateToken,
  generateUploadUrlHandler
);
app.post("/files/confirm-upload", authenticateToken, confirmUploadHandler);
app.post("/files/delete-file", authenticateToken, deleteFileHandler);
app.put("/files/update-file", authenticateToken, updateFileHandler);
app.get("/files/:id", authenticateToken, getFileHandler);

// Serve uploaded files statically (optional, if you still have local uploads)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 File Service running on port ${PORT}`);
});

module.exports = app;
