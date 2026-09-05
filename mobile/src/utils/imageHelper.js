import { API_BASE_URL } from '../services/api';

const getBackendHost = () => {
  const host = API_BASE_URL || 'https://swamidwijafoundation.com/api';
  return host.replace(/\/api\/?$/, '').replace(/\/+$/, '');
};

export const getCourseImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  let clean = url.trim().replace(/\\/g, '/');

  // If contains /uploads/, always route through backend host
  const uploadIdx = clean.indexOf('/uploads/');
  if (uploadIdx !== -1) {
    const backendHost = getBackendHost();
    const relativePath = clean.substring(uploadIdx).replace(/^\/+/, '/');
    return encodeURI(`${backendHost}${relativePath}`);
  }

  if (clean.startsWith('uploads/')) {
    const backendHost = getBackendHost();
    return encodeURI(`${backendHost}/${clean}`);
  }

  // Handle protocol-relative URL
  if (clean.startsWith('//')) {
    if (clean.startsWith('//uploads/')) {
      const backendHost = getBackendHost();
      return encodeURI(`${backendHost}${clean.substring(1)}`);
    }
    return encodeURI(`https:${clean}`);
  }

  // If localhost / 127.0.0.1 in mobile, rewrite to backendHost
  if (clean.startsWith('http://localhost') || clean.startsWith('http://127.0.0.1') || clean.startsWith('http://10.0.2.2')) {
    const backendHost = getBackendHost();
    try {
      const parsed = new URL(clean);
      return encodeURI(`${backendHost}${parsed.pathname}${parsed.search}`);
    } catch (e) {
      return null;
    }
  }

  // Upgrade http to https to prevent cleartext blocking
  if (clean.startsWith('http://')) {
    clean = clean.replace(/^http:\/\//i, 'https://');
  }

  if (clean.startsWith('https://') || clean.startsWith('data:')) {
    return encodeURI(clean);
  }

  if (clean.startsWith('/')) {
    const backendHost = getBackendHost();
    return encodeURI(`${backendHost}${clean}`);
  }

  const backendHost = getBackendHost();
  return encodeURI(`${backendHost}/uploads/courses/${clean}`);
};

export const getAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  let clean = url.trim().replace(/\\/g, '/');

  const uploadIdx = clean.indexOf('/uploads/');
  if (uploadIdx !== -1) {
    const backendHost = getBackendHost();
    const relativePath = clean.substring(uploadIdx).replace(/^\/+/, '/');
    return encodeURI(`${backendHost}${relativePath}`);
  }

  if (clean.startsWith('uploads/')) {
    const backendHost = getBackendHost();
    return encodeURI(`${backendHost}/${clean}`);
  }

  if (clean.startsWith('//')) {
    if (clean.startsWith('//uploads/')) {
      const backendHost = getBackendHost();
      return encodeURI(`${backendHost}${clean.substring(1)}`);
    }
    return encodeURI(`https:${clean}`);
  }

  if (clean.startsWith('http://localhost') || clean.startsWith('http://127.0.0.1') || clean.startsWith('http://10.0.2.2')) {
    const backendHost = getBackendHost();
    try {
      const parsed = new URL(clean);
      return encodeURI(`${backendHost}${parsed.pathname}${parsed.search}`);
    } catch (e) {
      return null;
    }
  }

  if (clean.startsWith('http://')) {
    clean = clean.replace(/^http:\/\//i, 'https://');
  }

  if (clean.startsWith('https://') || clean.startsWith('data:')) {
    return encodeURI(clean);
  }

  if (clean.startsWith('/')) {
    const backendHost = getBackendHost();
    return encodeURI(`${backendHost}${clean}`);
  }

  const backendHost = getBackendHost();
  return encodeURI(`${backendHost}/uploads/avatars/${clean}`);
};
