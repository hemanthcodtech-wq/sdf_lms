import { API_BASE_URL } from '../services/api';

const BACKEND_HOST = API_BASE_URL.replace(/\/api\/?$/, '');

export const getCourseImageUrl = (url) => {
  const fallback = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60';
  if (!url || typeof url !== 'string') return fallback;

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
