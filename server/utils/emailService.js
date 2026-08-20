const nodemailer = require('nodemailer');

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
              <li>Log in to your student portal at <a href="https://swamydwija.org/dashboard/learning" style="color: #0a4f2a; font-weight: bold;">My Learning Dashboard</a>.</li>
              <li>View your upcoming daily live schedule and one-click Zoom meeting join links.</li>
              <li>Recorded video practices and study guides will appear in your materials tab.</li>
            </ol>

            <div style="text-align: center; margin: 25px 0;">
              <a href="https://swamydwija.org/dashboard/learning" style="background-color: #0a4f2a; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; display: inline-block;">
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
    // Don't fail parent execution if email service is unconfigured
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
              <a href="https://swamydwija.org/dashboard/certificates" style="background-color: #0a4f2a; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; display: inline-block;">
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
 * Send Password Reset OTP Email
 */
const sendForgotPasswordOtpEmail = async ({ to, otp }) => {
  try {
    const from = `"Swamy Dwija Foundation" <${process.env.SMTP_USER || 'support@swamydwija.org'}>`;
    const transporter = createTransporter();

    const mailOptions = {
      from,
      to,
      subject: `🔐 ${otp} is your Password Reset Verification Code - SDF LMS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background-color: #FAF7F2; padding: 25px; border-radius: 16px; color: #333333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #0a4f2a; margin: 0; font-size: 22px;">Swamy Dwija Foundation</h1>
            <p style="color: #666666; font-size: 12px; margin: 4px 0 0 0;">Account Security Verification</p>
          </div>

          <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.03); text-align: center;">
            <h2 style="color: #1f2937; font-size: 18px; margin-top: 0;">Password Reset Request</h2>
            <p style="font-size: 13px; line-height: 1.5; color: #4b5563;">
              We received a request to reset the password for your Swamy Dwija Foundation learner account. Use the one-time verification code below:
            </p>

            <div style="background-color: #f0fdf4; border: 2px dashed #16a34a; padding: 15px; border-radius: 10px; margin: 20px auto; max-width: 250px;">
              <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0a4f2a; font-family: monospace;">${otp}</span>
            </div>

            <p style="font-size: 12px; color: #6b7280; margin: 15px 0 0 0;">
              ⏳ This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
            </p>
            <p style="font-size: 12px; color: #9ca3af; margin: 10px 0 0 0;">
              If you did not request a password reset, you can safely ignore this email.
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #9ca3af;">
            <p style="margin: 0;">Swamy Dwija Foundation • Security & Support</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Forgot Password OTP sent to ${to}:`, info.messageId || 'Success');
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] Error sending OTP email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendCourseEnrollmentEmail,
  sendCourseCompletionEmail,
  sendForgotPasswordOtpEmail
};
