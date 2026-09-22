/**
 * Standardized API helper that automatically attaches JWT Authorization header
 * from adminToken or userToken cookie/localStorage.
 */

export function getAuthToken() {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const adminParts = value.split(`; adminToken=`);
  if (adminParts.length === 2) return adminParts.pop().split(";").shift();
  const userParts = value.split(`; userToken=`);
  if (userParts.length === 2) return userParts.pop().split(";").shift();
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("adminToken") ||
      localStorage.getItem("userToken") ||
      null
    );
  }
  return null;
}

export async function authFetch(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
  };
  if (token && !headers["Authorization"] && !headers["authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(url, {
    ...options,
    headers,
  });
}
