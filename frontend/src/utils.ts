// src/utils.ts
// Instead of attaching a Bearer token from localStorage,
// we tell axios to send the httpOnly cookie automatically.
// The cookie is set by the server on login and is never accessible to JS.

export const authH = () => ({
  withCredentials: true,
});