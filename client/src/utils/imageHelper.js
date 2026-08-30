const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const BACKEND_HOST = API_BASE.replace(/\/api\/?$/, '');

export const getCourseImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '/assets/course_yoga.png';

  const clean = url.trim().replace(/\\/g, '/');

  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    return clean;
  }

  const uploadIdx = clean.indexOf('/uploads/');
  if (uploadIdx !== -1) {
    return `${BACKEND_HOST}${clean.substring(uploadIdx)}`;
  }

  if (clean.startsWith('uploads/')) {
    return `${BACKEND_HOST}/${clean}`;
  }

  if (clean.startsWith('/')) {
    return `${BACKEND_HOST}${clean}`;
  }

  return `${BACKEND_HOST}/uploads/courses/${clean}`;
};

export const getAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  const clean = url.trim().replace(/\\/g, '/');

  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    return clean;
  }

  const uploadIdx = clean.indexOf('/uploads/');
  if (uploadIdx !== -1) {
    return `${BACKEND_HOST}${clean.substring(uploadIdx)}`;
  }

  if (clean.startsWith('uploads/')) {
    return `${BACKEND_HOST}/${clean}`;
  }

  if (clean.startsWith('/')) {
    return `${BACKEND_HOST}${clean}`;
  }

  return `${BACKEND_HOST}/uploads/avatars/${clean}`;
};
