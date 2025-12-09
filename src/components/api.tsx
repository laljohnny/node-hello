import axios from "axios";

// ----------------- /account instance -----------------
const api = axios.create({
  baseURL: "http://api-dev2.criticalasset.com/",
});

// ----------------- /bff instance -----------------
const bffApi = axios.create({
  baseURL: "/",
});

// Common request interceptor
const requestInterceptor = (config: any) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Common response interceptor
const responseInterceptor = (response: any) => response;
const responseErrorInterceptor = async (error: any) => {
  if (error.response?.status === 401) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userData");
    window.location.href = "/login";
  }
  return Promise.reject(error);
};

// Apply interceptors to both instances
[api, bffApi].forEach((instance) => {
  instance.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
  instance.interceptors.response.use(responseInterceptor, responseErrorInterceptor);
});

export { api, bffApi };
