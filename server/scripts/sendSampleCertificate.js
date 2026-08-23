require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { generateCertificatePDF } = require('../utils/pdfGenerator');
const { sendCourseCompletionEmail } = require('../utils/emailService');

async function main() {
  const recipientEmail = 'ramarajukoyyalagadda@gmail.com';
  const studentName = 'Rama Raju Koyyalagadda';
  const courseTitle = 'Yoga for Wellness and Inner Balance';
  const studentId = 'SDWFY250501';
  const certificateId = 'SDWFY260823001';
  const completionDate = '23 August 2026';
  const duration = '30 Days (20 Hours)';
  const instructorName = 'Rishi Krishna';
  const instructorTitle = 'Yoga Instructor';
  const instructorSubtitle = 'Certified Yoga Professional';

  console.log(`Generating Certificate PDF for ${studentName} on new official template...`);

  try {
    const certPdfBuffer = await generateCertificatePDF({
      studentName,
      studentId,
      courseTitle,
      duration,
      instructorName,
      instructorTitle,
      instructorSubtitle,
      completionDate,
      certificateId
    });

    console.log(`Certificate PDF generated successfully (${certPdfBuffer.length} bytes).`);
    console.log(`Sending demo certificate email to ${recipientEmail}...`);

    const result = await sendCourseCompletionEmail({
      to: recipientEmail,
      studentName,
      course: { title: courseTitle },
      certId: certificateId,
      certificatePdfBuffer: certPdfBuffer
    });

    console.log('Email send result:', result);
    process.exit(0);
  } catch (error) {
    console.error('Failed to generate or send certificate email:', error);
    process.exit(1);
  }
}

main();

