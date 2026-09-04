/**
 * Helper utilities to compute course batch completion and student access validity
 */

/**
 * Returns the effective completion/end date of a course batch.
 * @param {Object} course 
 * @returns {Date}
 */
const getCourseBatchEndDate = (course) => {
  if (!course) return new Date();

  // 1. Check session dates (last session in array)
  if (Array.isArray(course.sessionDates) && course.sessionDates.length > 0) {
    const sortedDates = [...course.sessionDates].sort();
    const lastSessionDateStr = sortedDates[sortedDates.length - 1];
    if (lastSessionDateStr) {
      try {
        const clean = String(lastSessionDateStr).includes('T') 
          ? String(lastSessionDateStr).split('T')[0] 
          : String(lastSessionDateStr);
        const [y, m, d] = clean.split('-').map(Number);
        if (y && m && d) {
          let endH = 23, endM = 59;
          if (course.endTime) {
            const match = String(course.endTime).match(/(\d{1,2}):(\d{2})/);
            if (match) {
              endH = parseInt(match[1], 10);
              endM = parseInt(match[2], 10);
              if (String(course.endTime).toLowerCase().includes('pm') && endH < 12) endH += 12;
              if (String(course.endTime).toLowerCase().includes('am') && endH === 12) endH = 0;
              // 2 hour buffer after class finishes
              endH = Math.min(23, endH + 2);
            }
          }
          return new Date(y, m - 1, d, endH, endM, 59, 999);
        }
      } catch (e) {}
    }
  }

  // 2. Check endDate
  if (course.endDate) {
    const eDate = new Date(course.endDate);
    if (!isNaN(eDate.getTime())) {
      eDate.setHours(23, 59, 59, 999);
      return eDate;
    }
  }

  // 3. Check startDate + durationMonths
  if (course.startDate && course.durationMonths) {
    const sDate = new Date(course.startDate);
    if (!isNaN(sDate.getTime())) {
      const estEndDate = new Date(sDate);
      estEndDate.setMonth(estEndDate.getMonth() + Number(course.durationMonths || 1));
      estEndDate.setHours(23, 59, 59, 999);
      return estEndDate;
    }
  }

  // Fallback to createdAt + 30 days
  const base = course.createdAt ? new Date(course.createdAt) : new Date();
  return new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
};

/**
 * Checks if a course batch has finished its duration and should be closed/hidden from public catalog.
 * @param {Object} course 
 * @returns {Boolean}
 */
const isCourseBatchCompleted = (course) => {
  if (!course) return false;
  if (course.isArchived || course.isEnrollmentClosed) return true;

  const now = new Date();
  const batchEndDate = getCourseBatchEndDate(course);
  return now > batchEndDate;
};

/**
 * Calculates time-bound access validity for an enrolled student.
 * @param {Object} course 
 * @param {Object} [enrollment] 
 * @returns {{ validity: string, isExpired: boolean, accessExpiryDate: Date|null, validityLabel: string, batchEndDate: Date }}
 */
const calculateAccessValidity = (course, enrollment = null) => {
  const validity = course?.accessValidity || '2 Months';
  const batchEndDate = getCourseBatchEndDate(course);
  const now = new Date();

  if (/lifetime/i.test(validity)) {
    return {
      validity: 'Lifetime',
      isExpired: false,
      accessExpiryDate: null,
      validityLabel: 'Lifetime Access',
      batchEndDate
    };
  }

  // Determine validity days after batch completion
  let validityDays = 60; // default 2 months
  if (/1\s*month/i.test(validity)) validityDays = 30;
  else if (/2\s*month/i.test(validity)) validityDays = 60;
  else if (/3\s*month/i.test(validity)) validityDays = 90;
  else if (/6\s*month/i.test(validity)) validityDays = 180;
  else if (/1\s*year/i.test(validity)) validityDays = 365;

  // Access expires validityDays AFTER batchEndDate
  const expiryDate = new Date(batchEndDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
  const isExpired = now > expiryDate;

  const formattedExpiry = expiryDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return {
    validity,
    isExpired,
    accessExpiryDate: expiryDate,
    validityLabel: isExpired
      ? `Access Expired on ${formattedExpiry}`
      : `Access Valid until ${formattedExpiry}`,
    batchEndDate
  };
};

module.exports = {
  getCourseBatchEndDate,
  isCourseBatchCompleted,
  calculateAccessValidity
};
