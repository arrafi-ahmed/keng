import $axios from "@/plugins/axios";

export const namespaced = true;

export const state = {
  product: {},
  warranty: {},
  productIdentity: {},
  products: [],
};

export const mutations = {
  setProducts(state, payload) {
    state.products = payload;
  },
  setProduct(state, payload) {
    state.product = payload;
  },
  setWarranty(state, payload) {
    state.warranty = payload;
  },
  setProductIdentity(state, payload) {
    state.productIdentity = payload;
  },
  addProduct(state, payload) {
    state.products.unshift(payload);
  },
  editProduct(state, payload) {
    const foundIndex = state.products.findIndex(
      (item) => item.id == payload.id,
    );
    if (foundIndex !== -1) {
      state.products[foundIndex] = payload;
    }
  },
  removeProduct(state, payload) {
    const foundIndex = state.products.findIndex(
      (item) => item.id == payload.id,
    );
    if (foundIndex !== -1) {
      state.products.splice(foundIndex, 1);
    }
  },
};

export const actions = {
  async save({ commit }, request) {
    const response = await $axios.post("/api/product/save", request);
    return response.data?.payload;
  },

  async setProduct({ commit }, request) {
    const response = await $axios.get("/api/product/getProduct", {
      params: {
        productId: request.productId,
      },
    });
    commit("setProduct", response.data?.payload);
    return response.data?.payload;
  },

  async removeProduct({ commit }, request) {
    const response = await $axios.get("/api/product/removeProduct", {
      params: {
        productId: request.productId,
      },
    });
    commit("removeProduct", response.data?.payload);
    return response.data?.payload;
  },

  async setPublicProduct({ commit }, request) {
    const response = await $axios.get("/api/product/getPublicProduct", {
      params: {
        productId: request.productId,
        uuid: request.uuid,
      },
    });
    commit("setProduct", response.data?.payload);
    return response.data?.payload;
  },

  async setProductIdentity({ commit }, request) {
    const response = await $axios.get("/api/product/getProductIdentity", {
      params: {
        identityNo: request.identityNo,
      },
    });
    commit("setProductIdentity", response.data?.payload);
    return response.data?.payload;
  },

  async setPublicProductNScan({ commit }, request) {
    const response = await $axios.post(
      "/api/product/getPublicProductNScan",
      request,
    );
    commit("setProduct", response.data?.payload);
    return response.data?.payload;
  },

  async setWarranty({ commit }, request) {
    const response = await $axios.get("/api/product/getWarranty", {
      params: {
        productIdentitiesId: request.productIdentitiesId,
      },
    });
    commit("setWarranty", response.data?.payload);
    return response.data?.payload;
  },

  async setWarrantyWProduct({ commit }, request) {
    const response = await $axios.get("/api/product/getWarrantyWProduct", {
      params: {
        productId: request.productId,
        productIdentitiesId: request.productIdentitiesId,
        uuid: request.uuid,
      },
    });
    commit("setWarranty", response.data?.payload?.warranty);
    commit("setProduct", response.data?.payload?.product);
    return response.data?.payload;
  },

  async setWarrantyWProductNScan({ commit }, request) {
    const response = await $axios.post(
      "/api/product/getWarrantyWProductNScan",
      request,
    );
    commit("setWarranty", response.data?.payload);
    return response.data?.payload;
  },

  async saveWarranty({ commit }, request) {
    const response = await $axios.post("/api/product/saveWarranty", request);
    // const actionType = request.id ? "edit" : "add";
    // const actionName = `${actionType}Product`;
    // commit(actionName, response.data?.payload);
    return response.data?.payload;
  },

  async setProductsByUserId({ commit }, request) {
    const response = await $axios.get("/api/product/getProductsByUserId", {
      params: {
        offset: request.offset,
        limit: request.limit,
        fetchTotalCount: request.fetchTotalCount,
      },
    });
    commit("setProducts", response.data?.payload?.list);
    return response.data?.payload;
  },

  async bulkImport({ commit }, request) {
    const response = await $axios.post("/api/product/bulkImport", request);
    return response.data?.payload;
  },

  async bulkExport({ commit }, request) {
    const response = await $axios.get("/api/product/bulkExport", {
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: "application/zip",
    });

    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "products-export.zip";
    link.click();
    window.URL.revokeObjectURL(link.href);
  },
};

export const getters = {};
