<script setup>
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import {
  apiBaseUrl,
  appInfo,
  downloadFile,
  formatDate,
  getProductImageUrl,
  getUserLocation,
  handleRemoveQueriesNRedirect,
} from "@/others/util.js";
import { useDisplay } from "vuetify";
import Scan from "@/models/Scan.js";
import NoItems from "@/components/NoItems.vue";

definePage({
  name: "product-identity-single-landing",
  meta: {
    layout: "default",
    title: "Product Identity",
    requiresAuth: false,
  },
});
const { smAndDown } = useDisplay();
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
    const { latitude, longitude, timestamp } = await getUserLocation();

    const newScan = new Scan({
      scannedAt: timestamp,
      location: { latitude, longitude },
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

const handleDownloadManual = async () => {
  const filename = product.value.files?.[0]?.filename;
  if (!filename) return;

  store.commit("setProgress", true);
  const apiEndpoint = `${apiBaseUrl}/api/product/downloadManual?filename=${filename}`;
  await downloadFile(apiEndpoint);
  store.commit("setProgress", false);
};
const imageCarousel = ref(0);

const changeSelectedImage = (index) => {
  imageCarousel.value = index;
};

const expanded = ref(false)
const showToggle = ref(true) // Always show toggle for simplicity

const toggle = () => {
  expanded.value = !expanded.value
}

onMounted(async () => {
  await fetchData();
  document.title = `${product.value.name || "Product View"} | ${appInfo.name}`;
  // currentSelectedImage.value = product.value.images[0];
});
</script>

<template>
  <v-container class="fill-height d-block">
    <v-row justify="center" align="center">
      <v-col cols="12" lg="8">
        <v-sheet
          v-if="product?.id"
          class="px-3 mt-4 mt-md-6"
          rounded
          :elevation="3"
        >
          <v-row align="start" justify="center">
            <v-col cols="12" sm="10" md="6" order-md="2">
              <h1>{{ product.name }}</h1>
              <div :class="{ 'text-truncate-multi-line': !expanded }">
                {{ product.description }}
              </div>
              <v-btn
                v-if="showToggle"
                @click="toggle"
                variant="outlined"
                size="x-small"
                class="mt-2"
              >
                {{ expanded ? "Read less" : "Read more" }}
              </v-btn>
              <v-btn
                block
                color="primary"
                variant="flat"
                :max-width="500"
                class="mt-2"
                @click="handleDownloadManual"
              >
                Download Manual
              </v-btn>
              <div v-if="product.images?.length" class="mt-2 d-none d-md-block">
                <div>Product Images</div>
                <v-slide-group class="py-4" show-arrows>
                  <v-slide-group-item
                    v-for="(image, index) in product.images"
                    :key="index"
                    v-slot="{ isSelected, toggle }"
                  >
                    <v-card
                      class="rounded ml-2"
                      :border="isSelected ? 'secondary opacity-100 lg' : ''"
                      @click="toggle"
                    >
                      <v-img
                        :src="getProductImageUrl(image.filename)"
                        :height="80"
                        :width="80"
                        cover
                        @click="changeSelectedImage(index)"
                      />
                    </v-card>
                  </v-slide-group-item>
                </v-slide-group>
              </div>
            </v-col>
            <v-col cols="12" sm="10" md="5" order-md="1">
              <v-carousel
                v-model="imageCarousel"
                hide-delimiters
                :show-arrows="smAndDown === true"
                class="mt-2"
              >
                <v-carousel-item
                  v-for="(image, index) in product.images"
                  :key="index"
                >
                  <v-img
                    :src="getProductImageUrl(image.filename)"
                    class="rounded"
                    cover
                  />
                </v-carousel-item>

                <template #prev="{ props }">
                  <v-btn
                    icon="mdi-chevron-left"
                    color="grey-darken-2"
                    class="opacity-50"
                    size="small"
                    density="comfortable"
                    @click="props.onClick"
                  />
                </template>
                <template #next="{ props }">
                  <v-btn
                    icon="mdi-chevron-right"
                    color="grey-darken-2"
                    class="opacity-50"
                    size="small"
                    density="comfortable"
                    @click="props.onClick"
                  />
                </template>
              </v-carousel>
            </v-col>
          </v-row>
        </v-sheet>
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
