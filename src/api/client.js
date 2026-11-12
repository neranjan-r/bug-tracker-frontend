const BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

export const TOKEN_KEY = "token";

let unauthorizedHandler = null;

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Resolve upload/static paths from the backend origin when needed.
 */
export function getAssetUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const serverOrigin = BASE_URL.replace(/\/api$/, "");
  return `${serverOrigin}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export async function request(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body = options.body;
  if (body && !isFormData && typeof body !== "string") {
    body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    body,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.status === 401) {
    const isAuthAttempt =
      path.startsWith("/auth/login") || path.startsWith("/auth/register");
    if (!isAuthAttempt && unauthorizedHandler) {
      unauthorizedHandler();
    }
  }

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload?.message || "Request failed. Check your connection and try again."
    );
  }

  return payload.data;
}

export const api = {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};

/**
 * Upload FormData with real upload progress percentage reporting.
 */
export function uploadWithProgress(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}${path}`);

    const token = getToken();
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const pct = Math.round((event.loaded / event.total) * 100);
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      let payload = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        payload = null;
      }

      if (xhr.status === 401 && unauthorizedHandler) {
        unauthorizedHandler();
      }

      if (xhr.status < 200 || xhr.status >= 300 || !payload?.success) {
        reject(
          new Error(
            payload?.message || "Upload failed. Check your connection and try again."
          )
        );
        return;
      }

      resolve(payload.data);
    };

    xhr.onerror = () => {
      reject(
        new Error("Could not upload files. Check your connection and try again.")
      );
    };

    xhr.send(formData);
  });
}

export default api;
