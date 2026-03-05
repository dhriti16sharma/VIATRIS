// Session timeout management
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
let timeoutId;

export const initSessionTimeout = (router) => {
  resetTimeout(router);
  
  // Reset timeout on user activity
  const events = ['click', 'keypress', 'scroll', 'mousemove', 'touchstart'];
  events.forEach(event => {
    document.addEventListener(event, () => resetTimeout(router));
  });
};

const resetTimeout = (router) => {
  clearTimeout(timeoutId);
  
  timeoutId = setTimeout(() => {
    handleSessionExpired(router);
  }, SESSION_TIMEOUT);
};

const handleSessionExpired = (router) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    localStorage.clear();
    alert('Session expired due to inactivity. Please login again.');
    router.push('/');
  }
};

export const cleanupSessionTimeout = () => {
  clearTimeout(timeoutId);
};
