require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { generateCertificatePDF } = require('../utils/pdfGenerator');
const { sendCourseCompletionEmail } = require('../utils/emailService');

async function main() {
  const recipientEmail = 'ramarajukoyyalagadda123@gmail.com';
  const studentName = 'Rama Raju Koyyalagadda';
  const courseTitle = 'Master Class in Asana, Pranayama & Vedic Wellness';
  const certificateId = 'SDF-CERT-2026-849201';
  const completionDate = '22 August 2026';

  console.log(`Generating Certificate PDF for ${studentName} using improved classic template...`);

  try {
    const certPdfBuffer = await generateCertificatePDF({
      studentName,
      courseTitle,
      category: 'Ancient Himalayan Yoga',
      level: 'Mastery / Advanced',
      duration: '30 Days Live Program (60 Hours)',
      instructorName: 'Guru Madhulika (Senior Yoga Master)',
      completionDate,
      certificateId
    });

    console.log(`Certificate PDF generated successfully (${certPdfBuffer.length} bytes).`);
    console.log(`Sending updated sample certificate email to ${recipientEmail}...`);

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
