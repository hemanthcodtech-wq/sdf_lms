const getBackendHost = () => {
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, origin } = window.location;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return origin;
    }
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  return apiBase.replace(/\/api\/?$/, '');
};

export const getCourseImageUrl = (url) => {
  const fallback = '/images/morning_yoga.png';
  if (!url || typeof url !== 'string') return fallback;

  let clean = url.trim().replace(/\\/g, '/');

  // If contains /uploads/, always route through backend host
  const uploadIdx = clean.indexOf('/uploads/');
  if (uploadIdx !== -1) {
    const backendHost = getBackendHost().replace(/\/+$/, '');
    const relativePath = clean.substring(uploadIdx).replace(/^\/+/, '/');
    return `${backendHost}${relativePath}`;
  }

  if (clean.startsWith('uploads/')) {
    const backendHost = getBackendHost().replace(/\/+$/, '');
    return `${backendHost}/${clean}`;
  }

  // Handle protocol-relative URLs
  if (clean.startsWith('//')) {
    if (clean.startsWith('//uploads/')) {
      const backendHost = getBackendHost().replace(/\/+$/, '');
      return `${backendHost}${clean.substring(1)}`;
    }
    return `https:${clean}`;
  }

  // If localhost / 127.0.0.1 in live website, rewrite to current host
  if (clean.startsWith('http://localhost') || clean.startsWith('http://127.0.0.1')) {
    const backendHost = getBackendHost().replace(/\/+$/, '');
    try {
      const parsed = new URL(clean);
      return `${backendHost}${parsed.pathname}${parsed.search}`;
    } catch (e) {
      return fallback;
    }
  }

  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && clean.startsWith('http://')) {
      return clean.replace(/^http:\/\//i, 'https://');
    }
    return clean;
  }

  if (clean.startsWith('/')) {
    const backendHost = getBackendHost().replace(/\/+$/, '');
    return `${backendHost}${clean}`;
  }

  const backendHost = getBackendHost().replace(/\/+$/, '');
  return `${backendHost}/uploads/courses/${clean}`;
};

export const getAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  let clean = url.trim().replace(/\\/g, '/');

  const uploadIdx = clean.indexOf('/uploads/');
  if (uploadIdx !== -1) {
    const backendHost = getBackendHost().replace(/\/+$/, '');
    const relativePath = clean.substring(uploadIdx).replace(/^\/+/, '/');
    return `${backendHost}${relativePath}`;
  }

  if (clean.startsWith('uploads/')) {
    const backendHost = getBackendHost().replace(/\/+$/, '');
    return `${backendHost}/${clean}`;
  }

  if (clean.startsWith('//')) {
    if (clean.startsWith('//uploads/')) {
      const backendHost = getBackendHost().replace(/\/+$/, '');
      return `${backendHost}${clean.substring(1)}`;
    }
    return `https:${clean}`;
  }

  if (clean.startsWith('http://localhost') || clean.startsWith('http://127.0.0.1')) {
    const backendHost = getBackendHost().replace(/\/+$/, '');
    try {
      const parsed = new URL(clean);
      return `${backendHost}${parsed.pathname}${parsed.search}`;
    } catch (e) {
      return null;
    }
  }

  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && clean.startsWith('http://')) {
      return clean.replace(/^http:\/\//i, 'https://');
    }
    return clean;
  }

  if (clean.startsWith('/')) {
    const backendHost = getBackendHost().replace(/\/+$/, '');
    return `${backendHost}${clean}`;
  }

  const backendHost = getBackendHost().replace(/\/+$/, '');
  return `${backendHost}/uploads/avatars/${clean}`;
};
