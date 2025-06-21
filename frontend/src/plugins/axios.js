import axios from "axios";
import store from "@/store";

const $axios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

$axios.interceptors.request.use((config) => {
  store.commit("setProgress", true);
  const token = store.getters["user/getToken"];
  if (token) {
    config.headers["Authorization"] = token;
  }
  return config;
});

$axios.interceptors.response.use(
  (response) => {
    store.commit("setProgress", false);

    let action = "info";
    if (response.data?.msg) {
      if (response.status >= 200 && response.status <= 299) {
        action = "success";
      } else if (response.status >= 400 && response.status <= 499) {
        action = "error";
      }
      store.commit("addSnackbar", {
        text: response.data.msg,
        color: action,
      });
    }
    return response;
  },
  (err) => {
    store.commit("setProgress", false);
    if (err.response?.data?.msg) {
      store.commit("addSnackbar", {
        text: err.response?.data?.msg,
        color: "error",
      });
    }
    return Promise.reject(err);
  },
);

export default $axios;
