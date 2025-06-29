<script setup>
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import {
  appInfo,
  getUserLocation,
  handleRemoveQueriesNRedirect,
} from "@/others/util.js";
import Scan from "@/models/Scan.js";
import NoItems from "@/components/NoItems.vue";
import ProductCard from "@/components/ProductCard.vue";

definePage({
  name: "product-single-landing",
  meta: {
    layout: "default",
    title: "Product",
    requiresAuth: false,
  },
});
const store = useStore();
const route = useRoute();

const isScanned = computed(() => Number.parseInt(route.query.scanned) === 1);

const product = computed(() => store.state.product.product);
const productId = computed(() => route.params.productId);
const uuid = computed(() => route.query.uuid);

const fetchData = async () => {
  if (isScanned.value) {
    handleRemoveQueriesNRedirect({
      params: ["uuid", "scanned"],
      hardRedirect: false,
    });

    //get scan data
    let location;
    try {
      location = await getUserLocation();
    } catch (err) {
      console.warn("Geolocation error, proceeding without location:", err);
      location = null; // fallback gracefully
    }

    const newScan = new Scan({
      scannedAt: location?.timestamp,
      location,
      productId: productId.value,
    });

    await store.dispatch("product/setPublicProductNScan", {
      newScan,
      uuid: uuid.value,
    });
  } else {
    await store.dispatch("product/setPublicProduct", {
      productId: productId.value,
      uuid: uuid.value,
    });
  }
};

onMounted(async () => {
  await fetchData();
  document.title = `${product.value?.name || "Product View"} | ${appInfo.name}`;
  // currentSelectedImage.value = product.value.images[0];
});
</script>

<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" lg="8">
        <product-card
          v-if="product.id"
          :product="product"
          :showBuy="true"
        ></product-card>
        <no-items v-else />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>
