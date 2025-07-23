import axios, { AxiosError } from "axios";
import AuthService from "./authService";

const apiClient = axios.create({
  baseURL: "http://localhost:9000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- JWT REFRESH INTERCEPTOR LOGIC ---

let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
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

    // Check if the error is 401 and it's not a retry request
    if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
      if (isRefreshing) {
        // If a refresh is already in progress, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            (originalRequest.headers as any)['Authorization'] = 'Bearer ' + token;
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      (originalRequest as any)._retry = true;
      isRefreshing = true;

      try {
        const res = await AuthService.refresh();
        const newAccessToken = res.data.data.accessToken;
        
        // Update the default header for all subsequent requests
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        // Update the header for the original failed request
        (originalRequest.headers as any)['Authorization'] = `Bearer ${newAccessToken}`;
        
        processQueue(null, newAccessToken);
        
        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        // If refresh fails, log the user out by redirecting
        AuthService.handleLogoutNavigation();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;