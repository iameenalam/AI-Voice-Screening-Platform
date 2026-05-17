import nodemailer from 'nodemailer';

// Create transporter using SMTP settings from environment variables
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('⚠️ SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Format a Date for display in email
 */
function formatExpiryDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Send an interview invitation email to a candidate
 */
export async function sendInterviewInvitation({ to, candidateName, interviewLink, companyName, jobField, expiresAt }) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.error('❌ Cannot send email: SMTP not configured');
    throw new Error('Email service not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in your backend .env file');
  }

  const fromName = process.env.SMTP_FROM_NAME || 'Vocalent AI Screening';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  const expiryText = expiresAt ? formatExpiryDate(expiresAt) : '';
  const expiryRow = expiryText ? `
    <tr>
      <td style="padding: 16px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px;">
          <tr>
            <td style="padding: 12px 16px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #92400e; font-weight: 600;">⏰ This link expires on</p>
              <p style="margin: 0 0 4px; font-size: 15px; color: #78350f; font-weight: 700;">${expiryText}</p>
              <p style="margin: 0; font-size: 12px; color: #a16207;">Please complete your interview before this date. The link can only be used once.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : '';

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: `You're Invited to Interview!${companyName ? ` - ${companyName}` : ''}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Invitation</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                
                <!-- Logo -->
                <tr>
                  <td style="text-align: center; padding: 24px 0;">
                    <span style="font-size: 26px; font-weight: 700; color: #4f46e5; letter-spacing: -0.5px;">Vocalent</span>
                  </td>
                </tr>

                <!-- Main Card -->
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e4e4e7; overflow: hidden;">
                      
                      <!-- Header Banner -->
                      <tr>
                        <td style="background-color: #4f46e5; padding: 28px 24px; text-align: center;">
                          <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: 700;">You're Invited to Interview! 🎙️</h1>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding: 28px 24px 8px;">
                          <p style="margin: 0 0 16px; font-size: 16px; color: #18181b; line-height: 1.6;">
                            Hello <strong>${candidateName}</strong>,
                          </p>
                          <p style="margin: 0 0 16px; font-size: 15px; color: #3f3f46; line-height: 1.6;">
                            We're excited to inform you that your application${companyName ? ` at <strong>${companyName}</strong>` : ''}${jobField ? ` for <strong>${jobField}</strong>` : ''} has been reviewed, and we'd like to invite you to complete an AI-powered voice interview.
                          </p>
                          <p style="margin: 0 0 16px; font-size: 15px; color: #3f3f46; line-height: 1.6;">
                            The interview consists of a few questions relevant to the role. You'll respond using your microphone, and the process typically takes <strong>10–15 minutes</strong>.
                          </p>
                        </td>
                      </tr>

                      ${expiryRow}

                      <!-- CTA Button -->
                      <tr>
                        <td style="padding: 20px 24px 12px; text-align: center;">
                          <a href="${interviewLink}" style="display: inline-block; padding: 14px 36px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.3px;">Start Your Interview →</a>
                        </td>
                      </tr>

                      <!-- Fallback Link -->
                      <tr>
                        <td style="padding: 8px 24px 24px; text-align: center;">
                          <p style="margin: 0 0 6px; font-size: 13px; color: #71717a;">Or copy and paste this link into your browser:</p>
                          <a href="${interviewLink}" style="font-size: 13px; color: #4f46e5; word-break: break-all; text-decoration: underline;">${interviewLink}</a>
                        </td>
                      </tr>

                      <!-- Divider -->
                      <tr>
                        <td style="padding: 0 24px;">
                          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0;">
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="padding: 20px 24px; text-align: center;">
                          <p style="margin: 0 0 4px; font-size: 12px; color: #a1a1aa;">This is an automated invitation. Please complete your interview before the deadline.</p>
                          <p style="margin: 0; font-size: 12px; color: #a1a1aa;">Powered by <strong style="color: #4f46e5;">Vocalent AI</strong></p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Interview invitation sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
}
