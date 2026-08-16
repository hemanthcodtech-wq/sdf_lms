const nodemailer = require('nodemailer');

// Configure the transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to SendGrid, AWS SES, etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Helper to send email or log to console if credentials are not configured
 */
const sendEmail = async (to, subject, html) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`\n========================================`);
    console.log(`[MOCK EMAIL] To: ${to}`);
    console.log(`[Subject]: ${subject}`);
    console.log(`[Body]:\n${html}`);
    console.log(`========================================\n`);
    return { success: true, message: 'Mock email sent (check console)' };
  }

  try {
    const mailOptions = {
      from: `"SDF LMS" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };
    
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

/**
 * Send Booking/Enrollment Confirmation
 */
const sendEnrollmentConfirmation = async (userEmail, courseName, amountPaid) => {
  const subject = `Enrollment Confirmed: ${courseName}`;
  const html = `
    <h2>Welcome to ${courseName}!</h2>
    <p>Thank you for enrolling in this course.</p>
    <p><strong>Payment Received:</strong> $${amountPaid}</p>
    <p>You can now access your course content and class schedule from your dashboard.</p>
    <br>
    <p>Best Regards,<br>Swamy Dwija Foundation</p>
  `;
  return sendEmail(userEmail, subject, html);
};

/**
 * Send Class Schedule Change Alert
 */
const sendClassUpdateAlert = async (userEmail, courseName, classTitle, newDate, newTime) => {
  const subject = `Schedule Update: ${classTitle || courseName}`;
  const html = `
    <h2>Important Schedule Update</h2>
    <p>There has been a change to your scheduled class for <strong>${courseName}</strong>.</p>
    <p><strong>Topic:</strong> ${classTitle || 'Live Session'}</p>
    <p><strong>New Date:</strong> ${new Date(newDate).toLocaleDateString()}</p>
    <p><strong>New Time:</strong> ${newTime}</p>
    <p>Please check your calendar for the updated Zoom meeting link.</p>
    <br>
    <p>Best Regards,<br>Swamy Dwija Foundation</p>
  `;
  return sendEmail(userEmail, subject, html);
};

/**
 * Send Class Reminder
 */
const sendClassReminder = async (userEmail, courseName, classTitle, date, time, zoomLink) => {
  const subject = `Reminder: Upcoming Class for ${courseName}`;
  const html = `
    <h2>Class Reminder</h2>
    <p>This is a reminder that you have a live session coming up for <strong>${courseName}</strong>.</p>
    <p><strong>Topic:</strong> ${classTitle || 'Live Session'}</p>
    <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
    <p><strong>Time:</strong> ${time}</p>
    ${zoomLink ? `<p><a href="${zoomLink}" style="padding: 10px 15px; background-color: #297838; color: white; text-decoration: none; border-radius: 5px;">Join Zoom Meeting</a></p>` : ''}
    <br>
    <p>Best Regards,<br>Swamy Dwija Foundation</p>
  `;
  return sendEmail(userEmail, subject, html);
};

module.exports = {
  sendEmail,
  sendEnrollmentConfirmation,
  sendClassUpdateAlert,
  sendClassReminder
};
