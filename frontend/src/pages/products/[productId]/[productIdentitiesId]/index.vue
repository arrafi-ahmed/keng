<script setup>
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import {
  appInfo,
  formatDate,
  getUserLocation,
  handleRemoveQueriesNRedirect,
} from "@/others/util.js";
import Scan from "@/models/Scan.js";
import NoItems from "@/components/NoItems.vue";
import ProductCard from "@/components/ProductCard.vue";

definePage({
  name: "product-identity-single-landing",
  meta: {
    layout: "default",
    title: "Product Identity",
    requiresAuth: false,
  },
});
const store = useStore();
const route = useRoute();

const isScanned = computed(() => Number.parseInt(route.query.scanned) === 1);

const product = computed(() => store.state.product.product);
const warranty = computed(() => store.state.product.warranty);
const productId = computed(() => route.params.productId);
const productIdentitiesId = computed(() => route.params.productIdentitiesId);
const uuid = computed(() => route.query.uuid);

const fetchData = async () => {
  if (isScanned.value) {
    handleRemoveQueriesNRedirect({
      params: ["scanned"],
      hardRedirect: false,
    });

    //get scan data
    let location;
    try {
      location = await getUserLocation();
    } catch (err) {
      console.warn("Geolocation error, proceeding without location:", err);
      alert(`Geolocation error, proceeding without location: ${err.message}`);
      location = null; // fallback gracefully
    }

    const newScan = new Scan({
      scannedAt: location?.timestamp || new Date().getTime(),
      location,
      productId: productId.value,
      productIdentitiesId: productIdentitiesId.value,
    });

    await store.dispatch("product/setWarrantyWProductNScan", {
      newScan,
      uuid: uuid.value,
    });
  } else {
    await store.dispatch("product/setWarrantyWProduct", {
      productId: productId.value,
      productIdentitiesId: productIdentitiesId.value,
      uuid: uuid.value,
    });
  }
};

onMounted(async () => {
  await fetchData();
  document.title = `${product.value.name || "Product View"} | ${appInfo.name}`;
  // currentSelectedImage.value = product.value.images[0];
});
</script>

<template>
  <v-container class="fill-height d-block">
    <v-row align="center" justify="center">
      <v-col cols="12" lg="8">
        <product-card
          v-if="product.id"
          :product="product"
          :showBuy="false"
        ></product-card>
        <no-items v-else text="No matching product found." />
      </v-col>
    </v-row>

    <v-row justify="center">
      <v-col cols="12" lg="8">
        <v-card v-if="warranty?.id" class="mt-6" elevation="3" rounded="lg">
          <v-card-title class="font-weight-medium px-6 pt-6">
            <h3>Warranty Information</h3>
          </v-card-title>

          <v-divider class="mx-6 mb-4" />

          <v-card-text class="px-6 pb-6">
            <v-row dense>
              <v-col cols="12" md="6">
                <strong>Start Date:</strong>
                <div class="text-medium-emphasis">
                  {{ formatDate(warranty.warrantyStartDate) }}
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <strong>Expiration Date:</strong>
                <div class="text-medium-emphasis">
                  {{ formatDate(warranty.warrantyExpirationDate) }}
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <strong>Authenticity Confirmed:</strong>
                <div class="text-medium-emphasis">
                  {{ warranty.authenticityConfirmation ? "Yes" : "No" }}
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <strong>Support Contact:</strong>
                <div class="text-medium-emphasis text-pre-wrap">
                  {{ warranty.supportContact }}
                </div>
              </v-col>

              <v-col cols="12">
                <strong>Warranty Conditions:</strong>
                <div class="text-medium-emphasis text-pre-wrap">
                  {{ warranty.warrantyConditions }}
                </div>
              </v-col>

              <v-col cols="12">
                <strong>Void Conditions:</strong>
                <div class="text-medium-emphasis text-pre-wrap">
                  {{ warranty.voidConditions }}
                </div>
              </v-col>

              <v-col cols="12">
                <strong>Usage Advice:</strong>
                <div class="text-medium-emphasis text-pre-wrap">
                  {{ warranty.usageAdvice }}
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <no-items
          v-else
          text="No warranty information available for this product."
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<style>
.v-slide-group__prev,
.v-slide-group__next {
  min-width: inherit !important;
}
</style>
