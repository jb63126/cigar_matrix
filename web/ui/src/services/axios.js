import axios from "axios";
// import { getToken } from "../helpers/cookieHelper";
import { environment } from "../app.constants";
const { apiBaseUrl } = environment;

const axiosInstance = axios.create({
    baseURL: `${apiBaseUrl}`,
    headers: {}
});

// Request interceptor to add the auth token to every request
// axiosInstance.interceptors.request.use((config) => {
//     const token = getToken();
//     if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
// }, (error) => {
//     return Promise.reject(error);
// });

export default axiosInstance;
