import axios, { AxiosError } from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
});

// --- JWT REFRESH INTERCEPTOR LOGIC ---

let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Prevent refresh loops if the /refresh endpoint itself fails
    if (originalRequest?.url === "/api/auth/refresh") {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !(originalRequest as any)._retry
    ) {
      if (isRefreshing) {
        // --- FIX: Mark queued requests as retries to prevent loops ---
        (originalRequest as any)._retry = true;
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = "Bearer " + token;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      (originalRequest as any)._retry = true;
      isRefreshing = true;

      try {
        // Call the refresh endpoint directly, removing the AuthService dependency
        const res = await apiClient.post("/api/auth/refresh", {});
        const newAccessToken = res.data.data.accessToken;
        apiClient.defaults.headers.common["Authorization"] =
          `Bearer ${newAccessToken}`;
        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        }
        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        // --- THE CRITICAL FIX ---
        // The interceptor should not handle navigation.
        // It should just reject the promise and let the calling code (e.g., AuthContext) handle the failure.
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
