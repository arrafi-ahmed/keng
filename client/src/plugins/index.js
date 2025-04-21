/**
 * plugins/app.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import vuetify from "./vuetify";
import router from "../router";
import store from "../store";
import $axios from "@/plugins/axios";
import {getQueryParam, removeQueryParams} from "@/others/util";

function handleApiQueryMsg() {
  //check if message came from server through query params
  const apiQueryMsg = getQueryParam("apiQueryMsg");

  if (apiQueryMsg) {
    const newUrl = removeQueryParams(window.location.href, ["apiQueryMsg"]);
    localStorage.setItem("apiQueryMsg", apiQueryMsg);
    window.location.href = newUrl;
  }
}

function handleAuthRoutes(to, isSignedin, userRole) {
  if (to.matched.some((record) => record.meta.requiresNoAuth) && isSignedin) {
    return store.getters["user/calcHome"];
  } else if (
    to.matched.some((record) => record.meta.requiresAuth) &&
    !isSignedin
  ) {
    return { name: "signin" };
  } else if (!to.name && isSignedin) {
    return store.getters["user/calcHome"]; //undefined routes visited
  }
  return null;
}

export function registerPlugins(app) {
  router.beforeEach((to, from, next) => {
    //save routeinfo to state
    store.commit("setRouteInfo", { to, from });

    const isSignedin = store.getters["user/signedin"];
    const currentUser = store.getters["user/getCurrentUser"];
    const redirectRoute = handleAuthRoutes(to, isSignedin, currentUser.role);
    if (redirectRoute) {
      next(redirectRoute);
    } else {
      handleApiQueryMsg();
      next();
    }
  });

  app.use(vuetify).use(router).use(store);
  app.provide("$axios", $axios);
  window.$axios = $axios;
}
