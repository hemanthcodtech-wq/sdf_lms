const nodemailer = require('nodemailer');

// Helper to get sanitized client frontend URL from environment
const getClientBaseUrl = (customUrl) => {
  if (customUrl && typeof customUrl === 'string' && customUrl.trim() !== '') {
    return customUrl.replace(/\/$/, '');
  }
  const url = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
  return url.replace(/\/$/, '');
};

// Create reusable transporter using environment SMTP credentials
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      }
    });
  }

  // Fallback testing transporter (ethereal or logging)
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'ethereal.user@ethereal.email',
      pass: 'ethereal_pass'
    }
  });
};

/**
 * Send Course Enrollment Confirmation Email with Attached Invoice PDF
 */
const sendCourseEnrollmentEmail = async ({ to, studentName, course, invoiceNumber, amountPaid, invoicePdfBuffer }) => {
  try {
    const from = `"Swamy Dwija Foundation" <${process.env.SMTP_USER || 'support@swamydwija.org'}>`;
    const transporter = createTransporter();
    const clientBase = getClientBaseUrl();
    const dashboardUrl = `${clientBase}/dashboard/learning`;

    const mailOptions = {
      from,
      to,
      subject: `🎉 Enrollment Confirmed: ${course.title} - Swamy Dwija Foundation`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF7F2; padding: 25px; border-radius: 16px; color: #333333;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #0a4f2a; margin: 0; font-size: 24px;">Swamy Dwija Foundation</h1>
            <p style="color: #666666; font-size: 13px; margin: 4px 0 0 0;">Yoga, Pranayama & Holistic Wellness Academy</p>
          </div>

          <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            <h2 style="color: #1f2937; font-size: 18px; margin-top: 0;">Namaste ${studentName || 'Learner'}, 🙏</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
              Congratulations! Your enrollment in <strong>${course.title}</strong> has been successfully confirmed. We are thrilled to welcome you to this transformational wellness journey.
            </p>

            <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin: 0 0 8px 0; color: #166534; font-size: 15px;">Program Details:</h3>
              <p style="margin: 4px 0; font-size: 13px; color: #374151;"><strong>Course:</strong> ${course.title}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #374151;"><strong>Language:</strong> ${course.language || 'English'}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #374151;"><strong>Access Validity:</strong> ${course.accessValidity ? `${course.accessValidity} after completion` : '2 Months Access'}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #374151;"><strong>Amount Paid:</strong> ₹${amountPaid || course.price || 0}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #374151;"><strong>Invoice ID:</strong> ${invoiceNumber}</p>
            </div>

            <h3 style="color: #1f2937; font-size: 15px; margin-bottom: 8px;">How to Join Your Live Sessions:</h3>
            <ol style="font-size: 13px; color: #4b5563; line-height: 1.6; padding-left: 20px;">
              <li>Log in to your student portal at <a href="${dashboardUrl}" style="color: #0a4f2a; font-weight: bold;">My Learning Dashboard</a>.</li>
              <li>View your upcoming daily live schedule and one-click Zoom meeting join links.</li>
              <li>Recorded video practices and study guides will appear in your materials tab.</li>
            </ol>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${dashboardUrl}" style="background-color: #0a4f2a; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; display: inline-block;">
                Go to Student Dashboard →
              </a>
            </div>

            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px; border-top: 1px solid #f3f4f6; padding-top: 15px;">
              📎 <em>Your official payment receipt is attached to this email as a PDF.</em>
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0;">Swamy Dwija Foundation • Hyderabad, Telangana, India</p>
            <p style="margin: 4px 0 0 0;">Need assistance? Email us at <a href="mailto:support@swamydwija.org" style="color: #0a4f2a;">support@swamydwija.org</a></p>
          </div>
        </div>
      `,
      attachments: invoicePdfBuffer ? [
        {
          filename: `Invoice-${invoiceNumber || 'SDF-Receipt'}.pdf`,
          content: invoicePdfBuffer,
          contentType: 'application/pdf'
        }
      ] : []
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Enrollment confirmation email sent to ${to}:`, info.messageId || 'Success');
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] Error sending enrollment email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send Course Completion Congratulations Email with Attached Certificate PDF
 */
const sendCourseCompletionEmail = async ({ to, studentName, course, certId, certificatePdfBuffer }) => {
  try {
    const from = `"Swamy Dwija Foundation" <${process.env.SMTP_USER || 'support@swamydwija.org'}>`;
    const transporter = createTransporter();
    const clientBase = getClientBaseUrl();
    const certPortalUrl = `${clientBase}/dashboard/certificates`;

    const mailOptions = {
      from,
      to,
      subject: `🏆 Congratulations on Completing ${course.title}! - Certificate of Completion`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF7F2; padding: 25px; border-radius: 16px; color: #333333;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #0a4f2a; margin: 0; font-size: 24px;">Swamy Dwija Foundation</h1>
            <p style="color: #666666; font-size: 13px; margin: 4px 0 0 0;">Academy of Yoga & Vedic Sciences</p>
          </div>

          <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            <div style="text-align: center; margin-bottom: 15px;">
              <span style="font-size: 40px;">🏆</span>
              <h2 style="color: #0a4f2a; font-size: 22px; margin: 8px 0 0 0;">Certificate of Completion</h2>
              <p style="color: #b45309; font-weight: bold; font-size: 14px; margin: 4px 0 0 0;">Certificate ID: ${certId}</p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #4b5563; text-align: center;">
              Dear <strong>${studentName || 'Learner'}</strong>, we applaud your dedication and commitment! You have successfully completed all sessions and curriculum requirements for:
            </p>

            <div style="background-color: #fdfbf7; border: 2px dashed #d4af37; padding: 15px; border-radius: 10px; text-align: center; margin: 20px 0;">
              <h3 style="margin: 0; color: #0a4f2a; font-size: 18px;">${course.title}</h3>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #6b7280;">Issued on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #4b5563;">
              Your official Certificate of Completion has been generated and securely archived in your student dashboard. You can download and print high-resolution copies at any time.
            </p>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${certPortalUrl}" style="background-color: #0a4f2a; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; display: inline-block;">
                View in Certificate Portal →
              </a>
            </div>

            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px; border-top: 1px solid #f3f4f6; padding-top: 15px;">
              📜 <em>Your official certificate is attached to this email as a PDF.</em>
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0;">Swamy Dwija Foundation • All Rights Reserved</p>
          </div>
        </div>
      `,
      attachments: certificatePdfBuffer ? [
        {
          filename: `Certificate-${certId || 'SDF-Completion'}.pdf`,
          content: certificatePdfBuffer,
          contentType: 'application/pdf'
        }
      ] : []
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Certificate completion email sent to ${to}:`, info.messageId || 'Success');
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] Error sending certificate email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send Password Reset OTP & Direct Reset Link Email
 */
const sendForgotPasswordOtpEmail = async ({ to, name, otp, resetLink, role = 'user' }) => {
  try {
    const from = `"Swamy Dwija Foundation" <${process.env.SMTP_USER || 'support@swamydwija.org'}>`;
    const transporter = createTransporter();
    const clientBase = getClientBaseUrl();

    let roleTitle = 'Learner Account';
    let roleEmoji = '🔐';
    if (role === 'instructor') {
      roleTitle = 'Instructor & Guru Account';
      roleEmoji = '🧘';
    } else if (role === 'moderator') {
      roleTitle = 'Moderator Account';
      roleEmoji = '🛡️';
    } else if (role === 'admin') {
      roleTitle = 'Administrator Account';
      roleEmoji = '⚡';
    }

    const defaultResetUrl = resetLink || (
      role === 'instructor' ? `${clientBase}/instructor/login?forgot=true` :
      role === 'moderator' ? `${clientBase}/moderator/login?forgot=true` :
      role === 'admin' ? `${clientBase}/admin/login?forgot=true` :
      `${clientBase}/forgot-password`
    );

    const mailOptions = {
      from,
      to,
      subject: `${roleEmoji} ${otp} is your Password Reset Verification Code - SDF LMS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; background-color: #FAF7F2; padding: 25px; border-radius: 16px; color: #333333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #0a4f2a; margin: 0; font-size: 22px;">Swamy Dwija Foundation</h1>
            <p style="color: #666666; font-size: 12px; margin: 4px 0 0 0;">${roleTitle} Security Verification</p>
          </div>

          <div style="background-color: #ffffff; padding: 26px; border-radius: 14px; border: 1px solid #e5e7eb; box-shadow: 0 4px 14px rgba(0,0,0,0.03); text-align: center;">
            <div style="font-size: 38px; margin-bottom: 10px;">${roleEmoji}</div>
            <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 8px 0;">Password Reset Request</h2>
            <p style="font-size: 13px; line-height: 1.6; color: #4b5563; margin: 0 0 20px 0;">
              Hello ${name || 'User'}, we received a request to reset the password for your <strong>${roleTitle}</strong>. Use the 6-digit verification code below:
            </p>

            <!-- OTP Code Badge -->
            <div style="background-color: #f0fdf4; border: 2px dashed #16a34a; padding: 16px; border-radius: 12px; margin: 15px auto; max-width: 260px;">
              <span style="font-size: 34px; font-weight: 900; letter-spacing: 6px; color: #0a4f2a; font-family: monospace;">${otp}</span>
            </div>

            <p style="font-size: 12px; color: #6b7280; margin: 12px 0 18px 0;">
              ⏳ This code is valid for <strong>10 minutes</strong>. Never share this OTP with anyone.
            </p>

            ${defaultResetUrl ? `
              <div style="margin: 20px 0 10px 0; padding-top: 15px; border-top: 1px solid #f3f4f6;">
                <p style="font-size: 12px; color: #4b5563; margin-bottom: 12px;">Or use the direct password reset link below:</p>
                <a href="${defaultResetUrl}" style="background-color: #0a4f2a; color: #ffffff; padding: 11px 26px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 13px; display: inline-block;">
                  Reset Password Directly →
                </a>
              </div>
            ` : ''}

            <p style="font-size: 11px; color: #9ca3af; margin: 20px 0 0 0;">
              If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #9ca3af;">
            <p style="margin: 0;">Swamy Dwija Foundation • Security & Verification Unit</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Forgot Password OTP sent to ${to} (${role}):`, info.messageId || 'Success');
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] Error sending OTP email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send Instructor Account Welcome & Login Credentials Email
 */
const sendInstructorCredentialsEmail = async ({ to, name, email, password, speciality, experience, loginUrl }) => {
  try {
    const from = `"Swamy Dwija Foundation" <${process.env.SMTP_USER || 'support@swamydwija.org'}>`;
    const transporter = createTransporter();
    const portalUrl = loginUrl || `${getClientBaseUrl()}/instructor/login`;

    const mailOptions = {
      from,
      to,
      subject: `🧘 Welcome to Swamy Dwija Foundation! Your Instructor Portal Credentials`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF7F2; padding: 25px; border-radius: 16px; color: #333333;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #0a4f2a; margin: 0; font-size: 24px;">Swamy Dwija Foundation</h1>
            <p style="color: #666666; font-size: 13px; margin: 4px 0 0 0;">Academy of Yoga, Pranayama & Holistic Wellness Sciences</p>
          </div>

          <div style="background-color: #ffffff; padding: 28px; border-radius: 14px; border: 1px solid #e5e7eb; box-shadow: 0 4px 14px rgba(0,0,0,0.04);">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="font-size: 44px;">🙏</span>
              <h2 style="color: #0a4f2a; font-size: 20px; margin: 8px 0 4px 0;">Namaste & Welcome, ${name || 'Instructor'}!</h2>
              <p style="color: #4b5563; font-size: 14px; margin: 0;">
                You have been registered as an <strong>Official Instructor & Expert Guru</strong> on the Swamy Dwija Foundation LMS platform.
              </p>
            </div>

            <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 8px; margin: 22px 0;">
              <h3 style="margin: 0 0 8px 0; color: #166534; font-size: 15px;">Instructor Profile Details:</h3>
              <p style="margin: 4px 0; font-size: 13px; color: #374151;"><strong>Assigned Discipline / Category:</strong> <span style="background-color: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${speciality || 'Yoga & Wellness'}</span></p>
              ${experience ? `<p style="margin: 4px 0; font-size: 13px; color: #374151;"><strong>Experience:</strong> ${experience}</p>` : ''}
              <p style="margin: 4px 0; font-size: 13px; color: #374151;"><strong>Account Role:</strong> Certified Instructor</p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 10px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px; display: flex; align-items: center; gap: 6px;">
                🔐 Your Instructor Login Credentials
              </h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 120px;"><strong>Portal Login:</strong></td>
                  <td style="padding: 6px 0;"><a href="${portalUrl}" style="color: #0a4f2a; font-weight: bold; text-decoration: none;">${portalUrl}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;"><strong>Email / Username:</strong></td>
                  <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #1e293b;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;"><strong>Temporary Password:</strong></td>
                  <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #0a4f2a; background: #e6f4ea; padding-left: 8px; border-radius: 4px;">${password}</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #4b5563;">
              Through your instructor portal, you will be able to manage your live yoga & meditation sessions, host Zoom classrooms, track student attendance, and upload practice materials.
            </p>

            <div style="text-align: center; margin: 26px 0 15px 0;">
              <a href="${portalUrl}" style="background-color: #0a4f2a; color: #ffffff; padding: 13px 32px; text-decoration: none; font-weight: bold; border-radius: 10px; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(10,79,42,0.25);">
                Access Instructor Dashboard →
              </a>
            </div>

            <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 20px; border-top: 1px solid #f3f4f6; padding-top: 14px;">
              🔒 <em>For your security, we recommend changing your password upon first logging in.</em>
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0;">Swamy Dwija Foundation • Hyderabad, Telangana, India</p>
            <p style="margin: 4px 0 0 0;">Questions? Contact Admin at <a href="mailto:support@swamydwija.org" style="color: #0a4f2a;">support@swamydwija.org</a></p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Instructor credentials email sent to ${to}:`, info.messageId || 'Success');
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] Error sending instructor email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send Moderator Account Welcome & Login Credentials Email
 */
const sendModeratorCredentialsEmail = async ({ to, name, email, password, loginUrl }) => {
  try {
    const from = `"Swamy Dwija Foundation" <${process.env.SMTP_USER || 'support@swamydwija.org'}>`;
    const transporter = createTransporter();
    const portalUrl = loginUrl || `${getClientBaseUrl()}/moderator/login`;

    const mailOptions = {
      from,
      to,
      subject: `🛡️ Moderator Portal Access - Swamy Dwija Foundation`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF7F2; padding: 25px; border-radius: 16px; color: #333333;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #0a4f2a; margin: 0; font-size: 24px;">Swamy Dwija Foundation</h1>
            <p style="color: #666666; font-size: 13px; margin: 4px 0 0 0;">Platform Governance & Content Moderation</p>
          </div>

          <div style="background-color: #ffffff; padding: 28px; border-radius: 14px; border: 1px solid #e5e7eb; box-shadow: 0 4px 14px rgba(0,0,0,0.04);">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="font-size: 44px;">🛡️</span>
              <h2 style="color: #166534; font-size: 20px; margin: 8px 0 4px 0;">Welcome, ${name || 'Moderator'}!</h2>
              <p style="color: #4b5563; font-size: 14px; margin: 0;">
                You have been assigned as an official <strong>Platform Moderator</strong> for Swamy Dwija Foundation.
              </p>
            </div>

            <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 8px; margin: 22px 0;">
              <h3 style="margin: 0 0 8px 0; color: #166534; font-size: 15px;">Moderator Responsibilities:</h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #374151; line-height: 1.6;">
                <li>Oversee learner discussions, queries, and feedback</li>
                <li>Monitor live classroom etiquette and community guidelines</li>
                <li>Review flagged content and maintain a serene, positive learning space</li>
              </ul>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 10px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px;">
                🔐 Your Moderator Login Credentials
              </h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 120px;"><strong>Portal Login:</strong></td>
                  <td style="padding: 6px 0;"><a href="${portalUrl}" style="color: #166534; font-weight: bold; text-decoration: none;">${portalUrl}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;"><strong>Email / Username:</strong></td>
                  <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #1e293b;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;"><strong>Temporary Password:</strong></td>
                  <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #166534; background: #e0f2fe; padding-left: 8px; border-radius: 4px;">${password}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 26px 0 15px 0;">
              <a href="${portalUrl}" style="background-color: #0a4f2a; color: #ffffff; padding: 13px 32px; text-decoration: none; font-weight: bold; border-radius: 10px; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(10,79,42,0.25);">
                Access Moderator Dashboard →
              </a>
            </div>

            <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 20px; border-top: 1px solid #f3f4f6; padding-top: 14px;">
              🔒 <em>For your security, please update your temporary password after your initial login.</em>
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0;">Swamy Dwija Foundation • Platform Operations</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Moderator credentials email sent to ${to}:`, info.messageId || 'Success');
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] Error sending moderator email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send Student Registration Email Verification Code (OTP)
 */
const sendRegistrationOtpEmail = async ({ to, name, otp }) => {
  try {
    const from = `"Swamy Dwija Foundation" <${process.env.SMTP_USER || 'support@swamydwija.org'}>`;
    const transporter = createTransporter();

    const mailOptions = {
      from,
      to,
      subject: `✨ ${otp} is your Email Verification Code - Swamy Dwija Foundation`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; background-color: #FAF7F2; padding: 25px; border-radius: 16px; color: #333333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #0a4f2a; margin: 0; font-size: 22px;">Swamy Dwija Foundation</h1>
            <p style="color: #666666; font-size: 12px; margin: 4px 0 0 0;">Academy of Yoga, Pranayama & Vedic Sciences</p>
          </div>

          <div style="background-color: #ffffff; padding: 26px; border-radius: 14px; border: 1px solid #e5e7eb; box-shadow: 0 4px 14px rgba(0,0,0,0.03); text-align: center;">
            <div style="font-size: 38px; margin-bottom: 10px;">🧘‍♂️</div>
            <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 8px 0;">Verify Your Email Address</h2>
            <p style="font-size: 13px; line-height: 1.6; color: #4b5563; margin: 0 0 20px 0;">
              Namaste <strong>${name || 'Seeker'}</strong>, thank you for joining Swamy Dwija Foundation! Please enter the 6-digit verification code below to complete your registration:
            </p>

            <!-- OTP Code Badge -->
            <div style="background-color: #f0fdf4; border: 2px dashed #16a34a; padding: 16px; border-radius: 12px; margin: 15px auto; max-width: 260px;">
              <span style="font-size: 34px; font-weight: 900; letter-spacing: 6px; color: #0a4f2a; font-family: monospace;">${otp}</span>
            </div>

            <p style="font-size: 12px; color: #6b7280; margin: 12px 0 18px 0;">
              ⏳ This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
            </p>

            <div style="background-color: #f8fafc; border-radius: 10px; padding: 12px; font-size: 11px; color: #64748b; text-align: left; margin-top: 15px;">
              🛡️ If you did not request this registration, you can safely ignore this message.
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0;">Swamy Dwija Foundation • All Rights Reserved</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Registration OTP email sent to ${to}:`, info.messageId || 'Success');
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] Error sending registration OTP to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  getClientBaseUrl,
  sendCourseEnrollmentEmail,
  sendCourseCompletionEmail,
  sendForgotPasswordOtpEmail,
  sendRegistrationOtpEmail,
  sendInstructorCredentialsEmail,
  sendModeratorCredentialsEmail
};
