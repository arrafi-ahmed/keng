import $axios from "@/plugins/axios";

export const namespaced = true;

export const state = {
  token: localStorage.getItem("token") || null,
  currentUser: JSON.parse(localStorage.getItem("currentUser")) || {},
  users: [],
};

export const mutations = {
  setToken(state, payload) {
    localStorage.setItem("token", payload);
    state.token = payload;
  },
  setCurrentUser(state, payload) {
    state.currentUser = { ...state.currentUser, ...payload };
    let currentUser = JSON.parse(localStorage.getItem("currentUser"));
    currentUser = { ...currentUser, ...payload };
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  },
  removeToken(state) {
    localStorage.removeItem("token");
    state.token = null;
  },
  removeCurrentUser(state) {
    localStorage.removeItem("currentUser");
    state.currentUser = {};
  },
  setUsers(state, payload) {
    state.users = payload;
  },
  addUser(state, payload) {
    state.users.unshift(payload);
  },
  editUser(state, payload) {
    const foundIndex = state.users.findIndex((item) => item.id == payload.id);
    if (foundIndex !== -1) {
      state.users[foundIndex] = payload;
    }
  },
  removeUser(state, payload) {
    const foundIndex = state.users.findIndex((item) => item.id == payload.id);
    if (foundIndex !== -1) {
      state.users.splice(foundIndex, 1);
    }
  },
};

export const actions = {
  async signin({ commit }, request) {
    const response = await $axios.post("/user/signin", request);
    commit("setToken", response.headers?.authorization);
    commit("setCurrentUser", response.data?.payload?.currentUser);
    return response;
  },

  async signout({ commit }) {
    commit("removeToken");
    commit("removeCurrentUser");
  },

  async save({ commit }, request) {
    const response = await $axios.post("/user/save", request);
    const actionType = request.id ? "edit" : "add";
    const actionName = `${actionType}User`;
    commit(actionName, response.data?.payload);
    return response;
  },

  async setUsers({ commit }) {
    const response = await $axios.get("/user/getUsers");
    commit("setUsers", response.data?.payload);
    return response;
  },

  async requestResetPass({ commit }, request) {
    const response = await $axios.post("/user/requestResetPass", request);
    return response;
  },

  async submitResetPass({ commit }, request) {
    const response = await $axios.post("/user/submitResetPass", request);
    return response;
  },

  async removeUser({ commit }, request) {
    const response = await $axios.get("/user/removeUser", {
      params: { userId: request.id },
    });
    commit("removeUser", response.data?.payload);
    return response;
  },
};

export const getters = {
  getToken(state) {
    return state.token;
  },
  getCurrentUser(state) {
    return state.currentUser;
  },
  isAdmin(state) {
    return state.currentUser.role === 10;
  },
  isCustomer(state) {
    return state.currentUser.role === 20;
  },
  signedin(state) {
    return !!state.token;
  },
  calcHome(state, getters) {
    // add all the app roles here, and their default home page
    return getters.isAdmin
      ? { name: "admin-dashboard" }
      : getters.isCustomer
        ? { name: "customer-dashboard" }
        : { name: "signout" };
  },
};
