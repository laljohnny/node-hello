const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@criticalasset.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Send invitation email
 */
async function sendInvitationEmail(to, inviterName, companyName, token, role) {
    const inviteUrl = `${FRONTEND_URL}/accept-invitation?token=${token}`;

    const msg = {
        to,
        from: FROM_EMAIL,
        subject: `You've been invited to join ${companyName}`,
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
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Critical Asset Management</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> as a <strong>${role}</strong>.</p>
            <p>Click the button below to accept the invitation and set up your account:</p>
            <p style="text-align: center;">
              <a href="${inviteUrl}" class="button">Accept Invitation</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3280FA;">${inviteUrl}</p>
            <p><strong>Note:</strong> This invitation will expire in 7 days.</p>
          </div>
          <div class="footer">
            <p>© 2025 Critical Asset Management. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
    };

    await sgMail.send(msg);
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(to, token) {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    const msg = {
        to,
        from: FROM_EMAIL,
        subject: 'Reset your password',
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
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi,</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3280FA;">${resetUrl}</p>
            <p><strong>Note:</strong> This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2025 Critical Asset Management. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
    };

    await sgMail.send(msg);
}

/**
 * Send welcome email
 */
async function sendWelcomeEmail(to, name, companyName) {
    const msg = {
        to,
        from: FROM_EMAIL,
        subject: `Welcome to ${companyName}!`,
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
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Critical Asset Management!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Your account has been successfully created for <strong>${companyName}</strong>.</p>
            <p>You can now start managing your critical assets with our platform.</p>
            <p style="text-align: center;">
              <a href="${FRONTEND_URL}/login" class="button">Go to Dashboard</a>
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

    await sgMail.send(msg);
}

module.exports = {
    sendInvitationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail
};
