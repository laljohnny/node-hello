const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL;

/**
 * Generate pre-signed URL for upload
 */
function getSignedUploadUrl(key, contentType) {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Expires: 300, // 5 minutes
        ContentType: contentType,
        ACL: 'private'
    };

    return s3.getSignedUrl('putObject', params);
}

/**
 * Delete file from S3
 */
async function deleteFileFromS3(key) {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key
    };

    return s3.deleteObject(params).promise();
}

/**
 * Get public URL for file
 */
function getPublicUrl(key) {
    if (CLOUDFRONT_URL) {
        return `https://${CLOUDFRONT_URL}/${key}`;
    }
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

module.exports = {
    getSignedUploadUrl,
    deleteFileFromS3,
    getPublicUrl,
    s3,
    BUCKET_NAME
};
