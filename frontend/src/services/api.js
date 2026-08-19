import axios from "axios";

// =====================================================
// API BASE URL
// =====================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api/v1";

// =====================================================
// AXIOS TIMEOUT
// =====================================================
//
// Default: 120 seconds
//
// =====================================================

const API_TIMEOUT = Number(
  import.meta.env.VITE_API_TIMEOUT || 120000
);

// =====================================================
// AXIOS INSTANCE
// =====================================================

const api = axios.create({
  baseURL: API_BASE_URL,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  timeout: API_TIMEOUT,
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      "access_token"
    );

    if (token) {
      config.headers = config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  // ---------------------------------------------------
  // SUCCESS
  // ---------------------------------------------------

  (response) => {
    return response;
  },

  // ---------------------------------------------------
  // ERROR
  // ---------------------------------------------------

  (error) => {
    const status =
      error.response?.status;

    const requestUrl = String(
      error.config?.url || ""
    );

    // =================================================
    // AMS CREDENTIAL REQUEST
    // =================================================
    //
    // These endpoints validate credentials against
    // the external AMS system.
    //
    // IMPORTANT:
    //
    // A failed AMS login is NOT the same thing as
    // an expired application login.
    //
    // Therefore AMS credential errors must NEVER
    // clear the application token.
    //
    // =================================================

    const isAmsCredentialRequest =
      requestUrl.includes(
        "/profile/portal-credentials"
      );

    // =================================================
    // AMS ERROR
    // =================================================
    //
    // Backend should return:
    //
    // 400
    // {
    //   "detail": "Invalid AMS credentials..."
    // }
    //
    // We simply return the original Axios error.
    // getApiErrorMessage() below will extract
    // the backend message.
    //
    // =================================================

    if (isAmsCredentialRequest) {
      return Promise.reject(error);
    }

    // =================================================
    // NORMAL APPLICATION AUTHENTICATION
    // =================================================
    //
    // Only normal application API requests with
    // HTTP 401 should log the user out.
    //
    // =================================================

    if (status === 401) {
      localStorage.removeItem(
        "access_token"
      );

      localStorage.removeItem(
        "user"
      );

      const currentPath =
        window.location.pathname;

      if (
        currentPath !== "/login"
      ) {
        window.location.href =
          "/login";
      }
    }

    // =================================================
    // RETURN ORIGINAL ERROR
    // =================================================

    return Promise.reject(error);
  }
);

// =====================================================
// PORTAL SYNC CONFIG
// =====================================================

export const portalSyncConfig = () => {
  return {
    timeout: Math.max(
      API_TIMEOUT,
      120000
    ),
  };
};

// =====================================================
// CHECK TIMEOUT ERROR
// =====================================================

export const isApiTimeoutError = (
  error
) => {
  if (!error) {
    return false;
  }

  return (
    error.code ===
      "ECONNABORTED" ||

    error.code ===
      "ETIMEDOUT" ||

    String(
      error.message || ""
    )
      .toLowerCase()
      .includes("timeout")
  );
};

// =====================================================
// GET API ERROR MESSAGE
// =====================================================

export const getApiErrorMessage = (
  error,
  fallback = "Request failed."
) => {
  if (!error) {
    return fallback;
  }

  // =================================================
  // TIMEOUT
  // =================================================

  if (
    isApiTimeoutError(error)
  ) {
    return (
      "The server request timed out. " +
      "Please try again."
    );
  }

  // =================================================
  // FASTAPI DETAIL
  // =================================================

  const detail =
    error.response?.data?.detail;

  // -------------------------------------------------
  // detail = string
  // -------------------------------------------------

  if (
    typeof detail === "string" &&
    detail.trim()
  ) {
    return detail;
  }

  // -------------------------------------------------
  // detail = validation array
  // -------------------------------------------------

  if (
    Array.isArray(detail) &&
    detail.length > 0
  ) {
    const messages = detail
      .map((item) => {
        if (
          typeof item ===
          "string"
        ) {
          return item;
        }

        return (
          item?.msg ||
          item?.message ||
          ""
        );
      })
      .filter(Boolean);

    if (
      messages.length > 0
    ) {
      return messages.join(
        ", "
      );
    }
  }

  // =================================================
  // CUSTOM API MESSAGE
  // =================================================

  const message =
    error.response?.data?.message;

  if (
    typeof message === "string" &&
    message.trim()
  ) {
    return message;
  }

  // =================================================
  // ERROR
  // =================================================

  const errorMessage =
    error.response?.data?.error;

  if (
    typeof errorMessage ===
      "string" &&
    errorMessage.trim()
  ) {
    return errorMessage;
  }

  // =================================================
  // AXIOS ERROR MESSAGE
  // =================================================

  if (
    typeof error.message ===
      "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  // =================================================
  // HTTP STATUS FALLBACK
  // =================================================

  if (statusMessage(error)) {
    return statusMessage(
      error
    );
  }

  return fallback;
};

// =====================================================
// HTTP STATUS MESSAGE
// =====================================================

const statusMessage = (
  error
) => {
  const status =
    error?.response?.status;

  switch (status) {
    case 400:
      return "Invalid request.";

    case 401:
      return "Your session has expired. Please login again.";

    case 403:
      return "You do not have permission to perform this action.";

    case 404:
      return "Requested resource was not found.";

    case 409:
      return "This information already exists.";

    case 422:
      return "Some entered information is invalid.";

    case 500:
      return "Server error. Please try again.";

    case 502:
      return "Server is temporarily unavailable.";

    case 503:
      return "Service is temporarily unavailable.";

    default:
      return "";
  }
};

// =====================================================
// EXPORT
// =====================================================

export default api;