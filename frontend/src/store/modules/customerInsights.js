import $axios from "@/plugins/axios";

export const namespaced = true;

export const state = {
  stats: {},
  recentPurchases: [],
  qrCodes: [],
};

export const mutations = {
  setStats(state, payload) {
    state.stats = payload;
  },
  setRecentPurchases(state, payload) {
    state.recentPurchases = payload.items;
  },
  setQrCodes(state, payload) {
    state.qrCodes = payload.items;
  },
  addQrCode(state, payload) {
    state.qrCodes.unshift(payload);
  },
};

export const actions = {
  async setStats({ commit }) {
    const response = await $axios.get("/customerInsights/getStats");
    commit("setStats", response.data?.payload);
    return response.data?.payload;
  },
  async setRecentPurchases({ commit }, request) {
    const response = await $axios.get("/customerInsights/getRecentPurchases", {
      params: {
        fetchTotalCount: request.fetchTotalCount,
        offset: (request.page - 1) * request.itemsPerPage,
        limit: request.itemsPerPage,
      },
    });
    commit("setRecentPurchases", response.data?.payload);
    return response.data?.payload;
  },
  async setQrCodes({ commit }, request) {
    const response = await $axios.get("/customerInsights/getQrCodes", {
      params: {
        fetchTotalCount: request.fetchTotalCount,
        offset: (request.page - 1) * request.itemsPerPage,
        limit: request.itemsPerPage,
      },
    });
    commit("setQrCodes", response.data?.payload);
    return response.data?.payload;
  },
  async saveQrCode({ commit }, request) {
    const response = await $axios.post("/customerInsights/saveQrCode", request);
    commit("addQrCode", response.data?.payload);
    return response.data?.payload;
  },
};

export const getters = {};
