import { createStore } from "vuex";
import * as user from "./modules/user";
import * as product from "./modules/product";

const store = createStore({
  modules: {
    user,
    product,
  },
  state: () => ({
    progress: null,
    routeInfo: {},
  }),
  mutations: {
    setProgress(state, payload) {
      state.progress = payload;
    },
    setRouteInfo(state, payload) {
      state.routeInfo = payload;
    },
  },
  actions: {},
  getters: {},
});

export default store;
