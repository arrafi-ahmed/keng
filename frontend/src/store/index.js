import { createStore } from "vuex";
import * as user from "./modules/user";
import * as product from "./modules/product";
import * as scanAnalytics from "./modules/scanAnalytics";
import * as customerInsights from "./modules/customerInsights";

const store = createStore({
  modules: {
    user,
    product,
    scanAnalytics,
    customerInsights,
  },
  state: () => ({
    progress: null,
    snackbars: [],
    routeInfo: {},
  }),
  mutations: {
    setProgress(state, payload) {
      state.progress = payload;
    },
    setRouteInfo(state, payload) {
      state.routeInfo = payload;
    },
    addSnackbar(state, payload) {
      state.snackbars.push(payload);
    },
    setSnackbars(state, value) {
      state.snackbars = value; // v-snackbar-queue will update this
    },
  },
  actions: {},
  getters: {},
});

export default store;
