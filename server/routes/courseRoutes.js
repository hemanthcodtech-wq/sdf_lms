const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const Course = require('../models/Course');
const Class = require('../models/Class');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const { createZoomMeeting } = require('../services/zoomService');
const { sendCourseCompletionEmail } = require('../utils/emailService');
const { generateCertificatePDF } = require('../utils/pdfGenerator');
const { uploadBufferToCloudinary } = require('../utils/cloudinaryUploader');
const { isCourseBatchCompleted, getCourseBatchEndDate, calculateAccessValidity } = require('../utils/courseValidityHelper');
const upload = require('../middleware/upload');

const router = express.Router();

const cleanCourseUrls = (courseDoc) => {
  if (!courseDoc) return courseDoc;
  const course = courseDoc.toObject ? courseDoc.toObject() : { ...courseDoc };
  if (course.thumbnailUrl) {
    let clean = course.thumbnailUrl.replace(/\\/g, '/');
    const idx = clean.indexOf('/uploads/');
    if (idx !== -1) {
      clean = clean.substring(idx);
    } else if (clean.startsWith('uploads/')) {
      clean = '/' + clean;
    }
    course.thumbnailUrl = clean;
  }
  if (course.contentUrl) {
    let clean = course.contentUrl.replace(/\\/g, '/');
    const idx = clean.indexOf('/uploads/');
    if (idx !== -1) {
      clean = clean.substring(idx);
    } else if (clean.startsWith('uploads/')) {
      clean = '/' + clean;
    }
    course.contentUrl = clean;
  }
  return course;
};

// Get all courses (admin) - returns all courses with batch completion & access status
router.get('/', protect, admin, async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('instructorId', 'name emailOrPhone speciality phone')
      .populate('moderatorId', 'name emailOrPhone phone')
      .sort('-createdAt');

    const enrichedCourses = courses.map((courseDoc) => {
      const course = cleanCourseUrls(courseDoc);
      const isBatchCompleted = isCourseBatchCompleted(course);
      const batchEndDate = getCourseBatchEndDate(course);
      return {
        ...course,
        isBatchCompleted,
        batchEndDate,
        isEnrollmentClosed: Boolean(course.isEnrollmentClosed || isBatchCompleted)
      };
    });

    res.json({ success: true, data: enrichedCourses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Get enrollments for a specific course (admin)
router.get('/:id/enrollments', protect, admin, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.id })
      .sort('-createdAt');
    res.json({ success: true, data: enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Get all courses (public) - automatically hides completed batches from new students
router.get('/public', async (req, res) => {
  try {
    const courses = await Course.find({ 
      isPublished: true, 
      isArchived: { $ne: true },
      isEnrollmentClosed: { $ne: true }
    })
      .populate('instructorId', 'name emailOrPhone speciality phone bio')
      .populate('moderatorId', 'name emailOrPhone phone')
      .sort('-createdAt')
      .lean();

    // Auto-hide courses whose batch duration/session dates have completed
    const activeCourses = courses.filter((c) => !isCourseBatchCompleted(c));

    res.json({ success: true, data: activeCourses.map(cleanCourseUrls) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Get single course (public)
router.get('/public/:slugOrId', async (req, res) => {
  try {
    const { slugOrId } = req.params;
    let course;
    
    // Check if it's a valid ObjectId
    const mongoose = require('mongoose');
    if (mongoose.isValidObjectId(slugOrId)) {
      course = await Course.findById(slugOrId)
        .populate('instructorId', 'name emailOrPhone speciality phone bio')
        .populate('moderatorId', 'name emailOrPhone phone');
    }
    
    // If not found by ID, try finding by slug
    if (!course) {
      course = await Course.findOne({ slug: slugOrId })
        .populate('instructorId', 'name emailOrPhone speciality phone bio')
        .populate('moderatorId', 'name emailOrPhone phone');
    }

    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const cleaned = cleanCourseUrls(course);
    const isBatchCompleted = isCourseBatchCompleted(course);
    const batchEndDate = getCourseBatchEndDate(course);

    res.json({ 
      success: true, 
      data: {
        ...cleaned,
        isBatchCompleted,
        batchEndDate,
        isEnrollmentClosed: Boolean(course.isEnrollmentClosed || isBatchCompleted)
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Create new course
router.post('/', protect, admin, upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'content', maxCount: 1 }]), async (req, res) => {
  try {
    const { 
      title, description, category, duration, durationDays, durationHours, durationMonths, startDate, endDate, level, language, 
      accessValidity, startTime, endTime, price, instructorId, moderatorId, zoomMeetingLink,
      whatsappGroupLink
    } = req.body;

    let whatYouWillLearn = [];
    let topics = [];
    let selectedSessionDates = [];
    
    if (req.body.whatYouWillLearn) {
      try { whatYouWillLearn = JSON.parse(req.body.whatYouWillLearn); } catch (e) {}
    }
    if (req.body.topics) {
      try { topics = JSON.parse(req.body.topics); } catch (e) {}
    }
    if (req.body.selectedSessionDates) {
      try { selectedSessionDates = JSON.parse(req.body.selectedSessionDates); } catch (e) {}
    }
    
    let thumbnailUrl = '';
    let contentUrl = '';

    if (req.files) {
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        thumbnailUrl = `/uploads/courses/${req.files.thumbnail[0].filename}`;
      }
      if (req.files.content && req.files.content[0]) {
        contentUrl = `/uploads/courses/${req.files.content[0].filename}`;
      }
    }
    
    let baseSlug = (title || 'course').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    const existingSlug = await Course.findOne({ slug });
    if (existingSlug) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const timings = (startTime && endTime) ? `${startTime} to ${endTime}` : '';
    const coursePrice = price !== undefined && price !== '' ? Number(price) : 0;

    let instructorName = '';
    if (instructorId) {
      const instUser = await User.findById(instructorId);
      if (instUser) instructorName = instUser.name || instUser.emailOrPhone;
    }

    let moderatorName = '';
    if (moderatorId) {
      const modUser = await User.findById(moderatorId);
      if (modUser) moderatorName = modUser.name || modUser.emailOrPhone;
    }

    let finalDuration = duration;
    if (!finalDuration && (durationDays || durationHours)) {
      finalDuration = `${durationDays || '30 Days'} (${durationHours || '20 Hours'})`;
    }

    const course = await Course.create({
      title, 
      slug, 
      description: description || title || 'Comprehensive course program', 
      category: category || 'Other', 
      duration: finalDuration || '',
      durationDays: durationDays || '',
      durationHours: durationHours || '',
      durationMonths: durationMonths || 1, 
      startDate, 
      endDate, 
      startTime: startTime || '',
      endTime: endTime || '',
      timings, 
      sessionDates: selectedSessionDates,
      topics, 
      whatYouWillLearn,
      level: level || 'Beginner', 
      language: language || 'English',
      accessValidity: accessValidity || '2 Months',
      price: coursePrice,
      thumbnailUrl, 
      contentUrl,
      instructorId: instructorId || undefined,
      instructor: instructorName,
      moderatorId: moderatorId || undefined,
      moderator: moderatorName,
      zoomMeetingLink: zoomMeetingLink || '',
      whatsappGroupLink: (whatsappGroupLink || '').trim()
    });

    // Link assigned course to instructor user
    if (instructorId) {
      await User.findByIdAndUpdate(instructorId, {
        $addToSet: { assignedCourses: course._id }
      });
    }

    // Handle automated Class and Zoom meeting generation with sequential Session and Topic names
    if (selectedSessionDates.length > 0 && startTime && endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const durationMinutes = ((endHour * 60) + endMin) - ((startHour * 60) + startMin);
      
      // Sort session dates chronologically
      selectedSessionDates.sort((a, b) => new Date(a) - new Date(b));

      for (const [index, sessionDate] of selectedSessionDates.entries()) {
        try {
          const sessionIndex = index + 1;
          const topicName = (topics && topics.length > 0)
            ? `: ${topics[index % topics.length]}`
            : '';
          const classTitle = `${title} - Session ${sessionIndex}${topicName}`;

          const startTimeObj = new Date(`${sessionDate}T${startTime}:00`);
          let zoomJoinUrl = zoomMeetingLink || '';
          let zoomStartUrl = '';
          let zoomId = '';

          try {
            const zoomDetails = await createZoomMeeting(classTitle, startTimeObj.toISOString(), durationMinutes > 0 ? durationMinutes : 60);
            if (zoomDetails?.joinUrl) {
              zoomJoinUrl = zoomDetails.joinUrl;
              zoomStartUrl = zoomDetails.startUrl || '';
              zoomId = zoomDetails.meetingId;
            }
          } catch (zErr) {
            console.log('Zoom API not active or configured; using fallback session link.');
          }
          
          await Class.create({
            title: classTitle,
            courseId: course._id,
            instructor: instructorName,
            date: sessionDate,
            time: startTime,
            durationMinutes: durationMinutes > 0 ? durationMinutes : 60,
            isRecurring: false,
            zoomLink: zoomJoinUrl,
            zoomStartUrl: zoomStartUrl,
            zoomMeetingId: zoomId
          });
        } catch (err) {
          console.error(`Error generating class for ${sessionDate}:`, err);
        }
      }
    }

    const populatedCourse = await Course.findById(course._id)
      .populate('instructorId', 'name emailOrPhone speciality phone')
      .populate('moderatorId', 'name emailOrPhone phone');

    res.status(201).json({ success: true, data: populatedCourse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating course', error: error.message });
  }
});

// Update course
router.put('/:id', protect, admin, upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'content', maxCount: 1 }]), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const { 
      title, description, category, duration, durationDays, durationHours, durationMonths, startDate, endDate, timings, level, 
      language, accessValidity, price, startTime, endTime, instructorId, moderatorId, zoomMeetingLink,
      whatsappGroupLink
    } = req.body;
    
    let whatYouWillLearn = course.whatYouWillLearn;
    if (req.body.whatYouWillLearn) {
      try {
        whatYouWillLearn = JSON.parse(req.body.whatYouWillLearn);
      } catch (e) {}
    }

    let slug = course.slug;
    if (title && title !== course.title) {
      slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    let updateData = { 
      title, slug, description, category, durationMonths, startDate, endDate, 
      level, language: language || 'English', whatYouWillLearn 
    };

    if (duration !== undefined) updateData.duration = duration;
    if (durationDays !== undefined) updateData.durationDays = durationDays;
    if (durationHours !== undefined) updateData.durationHours = durationHours;
    if ((durationDays || durationHours) && !duration) {
      updateData.duration = `${durationDays || course.durationDays || '30 Days'} (${durationHours || course.durationHours || '20 Hours'})`;
    }

    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (accessValidity) updateData.accessValidity = accessValidity;
    if (timings) updateData.timings = timings;
    else if (startTime && endTime) updateData.timings = `${startTime} to ${endTime}`;

    if (price !== undefined && price !== '') {
      updateData.price = Number(price);
    }

    if (zoomMeetingLink !== undefined) {
      updateData.zoomMeetingLink = zoomMeetingLink;
    }

    if (whatsappGroupLink !== undefined) {
      updateData.whatsappGroupLink = (whatsappGroupLink || '').trim();
    }

    if (req.body.topics) {
      try {
        updateData.topics = JSON.parse(req.body.topics);
      } catch (e) {}
    }

    if (req.body.isEnrollmentClosed !== undefined) {
      updateData.isEnrollmentClosed = req.body.isEnrollmentClosed === true || req.body.isEnrollmentClosed === 'true';
    }
    if (req.body.isArchived !== undefined) {
      updateData.isArchived = req.body.isArchived === true || req.body.isArchived === 'true';
    }
    if (req.body.isPublished !== undefined) {
      updateData.isPublished = req.body.isPublished === true || req.body.isPublished === 'true';
    }

    if (instructorId !== undefined) {
      updateData.instructorId = instructorId || null;
      if (instructorId) {
        const instUser = await User.findById(instructorId);
        if (instUser) {
          updateData.instructor = instUser.name || instUser.emailOrPhone;
          await User.findByIdAndUpdate(instructorId, { $addToSet: { assignedCourses: course._id } });
        }
      } else {
        updateData.instructor = '';
      }
    }

    if (moderatorId !== undefined) {
      updateData.moderatorId = moderatorId || null;
      if (moderatorId) {
        const modUser = await User.findById(moderatorId);
        if (modUser) updateData.moderator = modUser.name || modUser.emailOrPhone;
      } else {
        updateData.moderator = '';
      }
    }

    if (req.files) {
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        updateData.thumbnailUrl = `/uploads/courses/${req.files.thumbnail[0].filename}`;
      }
      if (req.files.content && req.files.content[0]) {
        updateData.contentUrl = `/uploads/courses/${req.files.content[0].filename}`;
      }
    }

    if (req.body.selectedSessionDates) {
      try {
        updateData.sessionDates = JSON.parse(req.body.selectedSessionDates);
      } catch (e) {}
    }

    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('instructorId', 'name emailOrPhone speciality phone')
      .populate('moderatorId', 'name emailOrPhone phone');

    // If new session dates are supplied in update, create any missing sessions
    if (req.body.selectedSessionDates) {
      try {
        const selectedSessionDates = JSON.parse(req.body.selectedSessionDates);
        const sTime = startTime || (updatedCourse.timings ? updatedCourse.timings.split(' to ')[0] : '09:00');
        const eTime = endTime || (updatedCourse.timings ? updatedCourse.timings.split(' to ')[1] : '10:00');
        const [startHour, startMin] = sTime.split(':').map(Number);
        const [endHour, endMin] = eTime.split(':').map(Number);
        const durationMinutes = ((endHour * 60) + endMin) - ((startHour * 60) + startMin);

        for (const sessionDate of selectedSessionDates) {
          const existingClass = await Class.findOne({ courseId: updatedCourse._id, date: new Date(sessionDate) });
          if (!existingClass) {
            const startTimeObj = new Date(`${sessionDate}T${sTime}:00`);
            let zoomJoinUrl = updatedCourse.zoomMeetingLink || '';
            let zoomId = '';

            try {
              const zoomDetails = await createZoomMeeting(`${updatedCourse.title} Class`, startTimeObj.toISOString(), durationMinutes > 0 ? durationMinutes : 60);
              if (zoomDetails?.joinUrl) {
                zoomJoinUrl = zoomDetails.joinUrl;
                zoomId = zoomDetails.meetingId;
              }
            } catch (zErr) {}

            await Class.create({
              title: `${updatedCourse.title} Session`,
              courseId: updatedCourse._id,
              instructor: updatedCourse.instructor,
              date: sessionDate,
              time: sTime,
              durationMinutes: durationMinutes > 0 ? durationMinutes : 60,
              isRecurring: false,
              zoomLink: zoomJoinUrl,
              zoomMeetingId: zoomId
            });
          }
        }
      } catch (e) {
        console.error("Error updating session classes:", e);
      }
    }

    res.json({ success: true, data: updatedCourse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating course', error: error.message });
  }
});

// Delete course
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    
    await course.deleteOne();
    // Also cleanup classes and materials associated with course
    await Class.deleteMany({ courseId: req.params.id });
    const Material = require('../models/Material');
    await Material.deleteMany({ courseId: req.params.id });

    res.json({ success: true, message: 'Course and related sessions removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting course', error: error.message });
  }
});

// Add Material to Course (Admin)
router.post('/:id/materials', protect, admin, async (req, res) => {
  try {
    const Material = require('../models/Material');
    const { date, topicsCovered, driveLink, materialType } = req.body;
    
    const courseId = req.params.id;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const material = await Material.create({
      courseId,
      date,
      topicsCovered,
      driveLink,
      materialType: materialType || 'Recording'
    });

    res.status(201).json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding material', error: error.message });
  }
});

// Delete Material from Course (Admin)
router.delete('/:id/materials/:materialId', protect, admin, async (req, res) => {
  try {
    const Material = require('../models/Material');
    const { materialId } = req.params;
    await Material.findByIdAndDelete(materialId);
    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting material', error: error.message });
  }
});

// Get Materials for Course (Enrolled students and admin)
router.get('/:id/materials', protect, async (req, res) => {
  try {
    const Material = require('../models/Material');
    const materials = await Material.find({ courseId: req.params.id }).sort('-date');
    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching materials', error: error.message });
  }
});

// Complete Course & Generate Certificate (Student & Admin)
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const courseId = req.params.id;
    const { studentName: customName } = req.body;

    const course = await Course.findById(courseId).populate('instructorId');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const studentIdentifiers = [
      req.user.emailOrPhone,
      req.user.email,
      req.user.phone
    ].filter(Boolean);

    let enrollment = await Enrollment.findOne({
      course: courseId,
      $or: [
        { studentEmail: { $in: studentIdentifiers } },
        { user: req.user._id },
        { userId: req.user._id }
      ]
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'You are not enrolled in this course' });
    }

    const certId = enrollment.certificateId || `SDF-CERT-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
    const completionDate = enrollment.completionDate || new Date();

    enrollment.progress = 100;
    enrollment.completed = true;
    enrollment.completionDate = completionDate;
    enrollment.certificateId = certId;
    if (customName && customName.trim()) {
      enrollment.studentName = customName.trim();
    }
    await enrollment.save();

    // Get user full name
    const user = await User.findById(req.user._id);
    if (customName && customName.trim() && user) {
      user.name = customName.trim();
      await user.save();
    }

    let studentName = customName || enrollment.studentName || user?.name;
    if (!studentName && user?.firstName) {
      studentName = `${user.firstName} ${user.lastName || ''}`.trim();
    }
    if (!studentName) {
      studentName = (req.user.email || req.user.emailOrPhone || 'Learner').split('@')[0];
    }

    let instructorName = course.instructor || course.instructorId?.name;
    if (!instructorName && course.instructorId) {
      const instUser = await User.findById(course.instructorId).select('name');
      if (instUser?.name) instructorName = instUser.name;
    }
    instructorName = instructorName || 'Course Instructor';

    const toEmail = (
      req.user.email || 
      (req.user.emailOrPhone && req.user.emailOrPhone.includes('@') ? req.user.emailOrPhone : '') ||
      (enrollment.studentEmail && enrollment.studentEmail.includes('@') ? enrollment.studentEmail : '')
    );

    const courseDuration = course.duration || (course.durationDays && course.durationHours ? `${course.durationDays} (${course.durationHours})` : (course.sessionDates?.length ? `${course.sessionDates.length} Days (${course.sessionDates.length} Hours)` : '30 Days (20 Hours)'));

    // Generate Certificate PDF, upload, and auto-send completion email with attached PDF
    generateCertificatePDF({
      studentName,
      courseTitle: course.title,
      category: course.category || 'Yoga & Vedic Sciences',
      level: course.level || 'All Levels',
      duration: courseDuration,
      instructorName,
      completionDate: new Date(completionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      certificateId: certId
    }).then(async (certPdfBuffer) => {
      // Upload to Cloudinary if configured
      try {
        const cloudUrl = await uploadBufferToCloudinary(certPdfBuffer, certId, 'sdf_certificates');
        if (cloudUrl) {
          enrollment.certificateUrl = cloudUrl;
          await enrollment.save();
        }
      } catch (cErr) {
        console.error("Cloudinary certificate upload error:", cErr);
      }

      if (toEmail) {
        sendCourseCompletionEmail({
          to: toEmail,
          studentName,
          course,
          certId,
          certificatePdfBuffer: certPdfBuffer
        }).catch(emailErr => console.error("[Certificate] Email dispatch error:", emailErr));
      }
    }).catch(pdfErr => console.error("[Certificate] PDF generation error:", pdfErr));

    res.json({
      success: true,
      message: `Congratulations! Your certificate has been successfully generated and sent to ${toEmail || 'your registered email'}.`,
      certificateId: certId,
      enrollment
    });
  } catch (error) {
    console.error("Error completing course:", error);
    res.status(500).json({ success: false, message: 'Error completing course', error: error.message });
  }
});

// Update Student Name on Certificate & Regenerate
router.post('/certificate/:enrollmentId/update-name', protect, async (req, res) => {
  try {
    const { studentName } = req.body;
    if (!studentName || !studentName.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid student name' });
    }

    const enrollment = await Enrollment.findById(req.params.enrollmentId).populate('course');
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }

    // Verify ownership or admin
    if (enrollment.studentEmail !== req.user.emailOrPhone && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    enrollment.studentName = studentName.trim();
    const certId = enrollment.certificateId || `SDF-CERT-${Date.now().toString().slice(-6)}`;
    const compDate = enrollment.completionDate || new Date();

    const courseObj = await Course.findById(enrollment.course).populate('instructorId');
    let instructorName = courseObj?.instructor || courseObj?.instructorId?.name;
    if (!instructorName && courseObj?.instructorId) {
      const instUser = await User.findById(courseObj.instructorId).select('name');
      if (instUser?.name) instructorName = instUser.name;
    }
    instructorName = instructorName || 'Course Instructor';

    const courseDuration = courseObj?.duration || (courseObj?.durationDays && courseObj?.durationHours ? `${courseObj.durationDays} (${courseObj.durationHours})` : (courseObj?.sessionDates?.length ? `${courseObj.sessionDates.length} Days (${courseObj.sessionDates.length} Hours)` : '30 Days (20 Hours)'));

    const certPdfBuffer = await generateCertificatePDF({
      studentName: studentName.trim(),
      courseTitle: courseObj?.title || enrollment.course?.title || 'Workshop',
      duration: courseDuration,
      instructorName,
      completionDate: new Date(compDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
      certificateId: certId
    });

    try {
      const cloudUrl = await uploadBufferToCloudinary(certPdfBuffer, certId, 'sdf_certificates');
      if (cloudUrl) {
        enrollment.certificateUrl = cloudUrl;
      }
    } catch (cErr) {
      console.error('Cloudinary update error:', cErr);
    }

    await enrollment.save();

    // Also update user profile name if current student
    const user = await User.findOne({ emailOrPhone: enrollment.studentEmail });
    if (user) {
      user.name = studentName.trim();
      await user.save();
    }

    res.json({
      success: true,
      message: 'Certificate name updated successfully!',
      enrollment
    });
  } catch (err) {
    console.error('Error updating certificate name:', err);
    res.status(500).json({ success: false, message: 'Error updating certificate name', error: err.message });
  }
});

// Admin: Mark student course complete & issue certificate
router.post('/admin/issue-certificate/:enrollmentId', protect, admin, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.enrollmentId).populate('course');
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }

    const certId = enrollment.certificateId || `SDF-CERT-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
    const completionDate = new Date();

    enrollment.progress = 100;
    enrollment.completed = true;
    enrollment.completionDate = completionDate;
    enrollment.certificateId = certId;
    await enrollment.save();

    const user = await User.findOne({ emailOrPhone: enrollment.studentEmail });
    let studentName = user?.name;
    if (!studentName && user?.firstName) {
      studentName = `${user.firstName} ${user.lastName || ''}`.trim();
    }
    if (!studentName) {
      studentName = enrollment.studentEmail.split('@')[0];
    }

    const courseObj = await Course.findById(enrollment.course).populate('instructorId');
    let instructorName = courseObj?.instructor || courseObj?.instructorId?.name;
    if (!instructorName && courseObj?.instructorId) {
      const instUser = await User.findById(courseObj.instructorId).select('name');
      if (instUser?.name) instructorName = instUser.name;
    }
    instructorName = instructorName || 'Course Instructor';

    const courseDuration = courseObj?.duration || (courseObj?.durationDays && courseObj?.durationHours ? `${courseObj.durationDays} (${courseObj.durationHours})` : (courseObj?.sessionDates?.length ? `${courseObj.sessionDates.length} Days (${courseObj.sessionDates.length} Hours)` : '30 Days (20 Hours)'));

    const certPdfBuffer = await generateCertificatePDF({
      studentName,
      courseTitle: courseObj?.title || enrollment.course?.title || 'Yoga Course',
      duration: courseDuration,
      instructorName,
      completionDate: new Date(completionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      certificateId: certId
    });

    const cloudUrl = await uploadBufferToCloudinary(certPdfBuffer, certId, 'sdf_certificates');
    if (cloudUrl) {
      enrollment.certificateUrl = cloudUrl;
      await enrollment.save();
    }

    sendCourseCompletionEmail({
      to: enrollment.studentEmail,
      studentName,
      course: enrollment.course,
      certId,
      certificatePdfBuffer: certPdfBuffer
    }).catch(e => console.error("Email error:", e));

    res.json({ success: true, message: 'Certificate issued successfully', enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error issuing certificate', error: err.message });
  }
});

// Download Certificate PDF
router.get('/certificate/:enrollmentId/download', async (req, res) => {
  try {
    // Authenticate via Bearer header or query token (for direct mobile downloads)
    let token = req.headers.authorization?.startsWith('Bearer') 
      ? req.headers.authorization.split(' ')[1] 
      : req.query.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to download certificate' });
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
    }

    const enrollment = await Enrollment.findById(req.params.enrollmentId).populate('course');
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    const user = await User.findById(decoded.id);
    let studentName = enrollment.studentName;
    if (!studentName) {
      if (user?.name) {
        studentName = user.name;
      } else if (user?.firstName) {
        studentName = `${user.firstName} ${user.lastName || ''}`.trim();
      } else {
        studentName = enrollment.studentEmail.split('@')[0];
      }
    }

    const certId = enrollment.certificateId || `SDF-CERT-${enrollment._id.toString().slice(-6).toUpperCase()}`;
    const compDate = enrollment.completionDate || enrollment.updatedAt || new Date();
    const studentId = user?.studentId || (user?._id ? `SDWFY${user._id.toString().slice(-6).toUpperCase()}` : 'SDWFY250501');

    const courseObj = await Course.findById(enrollment.course).populate('instructorId');
    let instructorName = courseObj?.instructor || courseObj?.instructorId?.name;
    if (!instructorName && courseObj?.instructorId) {
      const instUser = await User.findById(courseObj.instructorId).select('name');
      if (instUser?.name) instructorName = instUser.name;
    }
    instructorName = instructorName || 'Course Instructor';

    const certBuffer = await generateCertificatePDF({
      studentName,
      studentId,
      courseTitle: courseObj?.title || enrollment.course?.title || 'Yoga & Vedic Sciences',
      instructorName,
      completionDate: new Date(compDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      certificateId: certId,
      duration: courseObj?.duration || enrollment.course?.duration || (courseObj?.durationDays && courseObj?.durationHours ? `${courseObj.durationDays} (${courseObj.durationHours})` : (courseObj?.sessionDates?.length ? `${courseObj.sessionDates.length} Days (${courseObj.sessionDates.length} Hours)` : '30 Days (20 Hours)'))
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificate-${certId}.pdf`);
    res.send(certBuffer);
  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({ success: false, message: 'Error generating certificate PDF', error: error.message });
  }
});

module.exports = router;
