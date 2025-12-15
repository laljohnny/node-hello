const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@criticalasset.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Send maintenance reminder email to assigned user
 * @param {string} to - Recipient email address
 * @param {Object} details - Maintenance details
 * @param {string} details.assetName - Name of the asset
 * @param {string} details.maintenanceTitle - Title of the maintenance schedule
 * @param {string} details.scheduledDate - Scheduled maintenance date
 * @param {string} details.assetId - Asset ID for linking
 */
async function sendMaintenanceReminderEmail(to, details) {
    const { assetName, maintenanceTitle, scheduledDate, assetId } = details;
    const assetUrl = `${FRONTEND_URL}/assets/${assetId}`;

    const msg = {
        to,
        from: FROM_EMAIL,
        subject: `Maintenance Reminder: ${maintenanceTitle}`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1E3B89 0%, #3280FA 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #FFFFFF; padding: 30px; border: 1px solid #EDEEF6; border-top: none; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #3280FA; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .info-box { background: #F8F9FD; border-left: 4px solid #3280FA; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .detail-row { margin: 10px 0; }
          .detail-label { font-weight: bold; color: #1E3B89; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔧 Maintenance Reminder</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>This is a reminder about upcoming scheduled maintenance:</p>
            
            <div class="info-box">
              <div class="detail-row">
                <span class="detail-label">Asset:</span> ${assetName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Maintenance:</span> ${maintenanceTitle}
              </div>
              <div class="detail-row">
                <span class="detail-label">Scheduled Date:</span> ${scheduledDate}
              </div>
            </div>

            <p>Please ensure this maintenance is completed on time to keep your asset in optimal condition.</p>
            
            <p style="text-align: center;">
              <a href="${assetUrl}" class="button">View Asset Details</a>
            </p>
            
            <p><strong>Need to reschedule?</strong> Please update the maintenance schedule in the system or contact your supervisor.</p>
          </div>
          <div class="footer">
            <p>© 2025 Critical Asset Management. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
    };

    try {
        await sgMail.send(msg);
        console.log(`✅ Maintenance reminder sent to ${to} for ${maintenanceTitle}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Failed to send maintenance reminder to ${to}:`, error.message);
        throw error;
    }
}

/**
 * Send overdue maintenance notification
 * @param {string} to - Recipient email address
 * @param {Object} details - Maintenance details
 */
async function sendOverdueMaintenanceEmail(to, details) {
    const { assetName, maintenanceTitle, scheduledDate, assetId } = details;
    const assetUrl = `${FRONTEND_URL}/assets/${assetId}`;

    const msg = {
        to,
        from: FROM_EMAIL,
        subject: `⚠️ Overdue Maintenance: ${maintenanceTitle}`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #FFFFFF; padding: 30px; border: 1px solid #EDEEF6; border-top: none; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #DC2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning-box { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .detail-row { margin: 10px 0; }
          .detail-label { font-weight: bold; color: #DC2626; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Overdue Maintenance Alert</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p><strong>Important:</strong> The following scheduled maintenance is now overdue:</p>
            
            <div class="warning-box">
              <div class="detail-row">
                <span class="detail-label">Asset:</span> ${assetName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Maintenance:</span> ${maintenanceTitle}
              </div>
              <div class="detail-row">
                <span class="detail-label">Was Due:</span> ${scheduledDate}
              </div>
            </div>

            <p>Please complete this maintenance as soon as possible to prevent potential issues and maintain asset reliability.</p>
            
            <p style="text-align: center;">
              <a href="${assetUrl}" class="button">View Asset & Update Status</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2025 Critical Asset Management. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
    };

    try {
        await sgMail.send(msg);
        console.log(`✅ Overdue notification sent to ${to} for ${maintenanceTitle}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Failed to send overdue notification to ${to}:`, error.message);
        throw error;
    }
}

module.exports = {
    sendMaintenanceReminderEmail,
    sendOverdueMaintenanceEmail
};
