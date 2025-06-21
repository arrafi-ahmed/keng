import $axios from "@/plugins/axios";

export const namespaced = true;

export const state = {
  totalScanCount: null,
  monthlyScanCount: null,
  dailyScanCount: null,
  scanByLocation: null,
};

export const mutations = {
  setScanAnalytics(state, payload) {
    state.totalScanCount = payload.totalScanCount;
    state.monthlyScanCount = payload.monthlyScanCount;
    state.dailyScanCount = payload.dailyScanCount;
    state.scanByLocation = payload.scanByLocation;
  },
};

export const actions = {
  async setScanAnalytics({ commit }) {
    const response = await $axios.get("/api/scanAnalytics/getScanAnalytics");
    commit("setScanAnalytics", response.data?.payload);
    return response.data?.payload;
  },
};

export const getters = {};
