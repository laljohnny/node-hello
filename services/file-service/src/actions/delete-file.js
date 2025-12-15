const Joi = require("joi");
const db = require("../utils/db");
const { deleteFileFromS3 } = require("../utils/s3");

const deleteFileSchema = Joi.object({
  fileId: Joi.string().uuid().required(),
});

/**
 * Delete File Handler
 */
async function deleteFile(req, res) {
  try {
    const { schema } = req.user;

    if (!schema) {
      return res
        .status(400)
        .json({ message: "User context missing schema information" });
    }

    const { error, value } = deleteFileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { fileId } = value;

    // Get file key first
    const fileResult = await db.query(
      `SELECT file_path FROM ${schema}.files WHERE id = $1`,
      [fileId]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    const fileKey = fileResult.rows[0].file_path;

    // Delete from S3
    await deleteFileFromS3(fileKey);

    // Delete from database (soft delete)
    await db.query(
      `UPDATE ${schema}.files SET deleted_at = NOW() WHERE id = $1`,
      [fileId]
    );

    res.json({ success: true, message: "File deleted" });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({ message: "Failed to delete file" });
  }
}

module.exports = deleteFile;
