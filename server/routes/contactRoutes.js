const express = require('express');
const router = express.Router();
const { sendContactInquiryEmail } = require('../utils/emailService');

// POST /api/contact/submit
router.post('/submit', async (req, res) => {
  try {
    const { name, email, phone, queryType, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields.'
      });
    }

    // Send emails via emailService
    const emailResult = await sendContactInquiryEmail({
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      queryType: queryType ? queryType.trim() : 'General Inquiry',
      message: message.trim()
    });

    if (emailResult.success) {
      return res.status(200).json({
        success: true,
        message: 'Thank you! Your message has been sent successfully. We will get back to you shortly.'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Could not send message. Please try contacting us via phone or WhatsApp.',
        error: emailResult.error
      });
    }
  } catch (error) {
    console.error('Error handling contact form submission:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing contact inquiry',
      error: error.message
    });
  }
});

module.exports = router;
