<script setup>
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import {
  apiBaseUrl,
  appInfo, defaultCurrency,
  downloadFile,
  getProductImageUrl,
  getUserLocation,
  handleRemoveQueriesNRedirect,
} from "@/others/util.js";
import { useDisplay } from "vuetify";
import Scan from "@/models/Scan.js";
import NoItems from "@/components/NoItems.vue";

definePage({
  name: "product-single-landing",
  meta: {
    layout: "default",
    title: "Product",
    requiresAuth: false,
  },
});
const { smAndDown } = useDisplay();
const store = useStore();
const router = useRouter();
const route = useRoute();

const isScanned = computed(() => Number.parseInt(route.query.scanned) === 1);

const product = computed(() => store.state.product.product);
const productId = computed(() => route.params.productId);
const uuid = computed(() => route.query.uuid);
const isAvailable = computed(() => Number(product.value?.availableStock) > 0);

const fetchData = async () => {
  if (isScanned.value) {
    handleRemoveQueriesNRedirect({
      params: ["uuid", "scanned"],
      hardRedirect: false,
    });

    //get scan data
    const { latitude, longitude, timestamp } = await getUserLocation();

    const newScan = new Scan({
      scannedAt: timestamp,
      location: { latitude, longitude },
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
  document.title = `${product.value?.name || "Product View"} | ${appInfo.name}`;
  // currentSelectedImage.value = product.value.images[0];
});
</script>

<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" lg="8">
        <v-sheet v-if="product?.id" class="px-3" rounded :elevation="3">
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
              <h3 class="font-weight-medium mt-2">
                {{ defaultCurrency.symbol }}{{ product.price }}
              </h3>
              <div
                v-if="product.availableStock > 0 && product.availableStock < 5"
                class="text-red text-center mt-2"
              >
                Only {{ product.availableStock }} left in stock!
              </div>
              <div
                v-else-if="product.availableStock == 0"
                class="text-red text-center mt-2"
              >
                Out of stock!
              </div>

              <v-btn
                block
                :color="isAvailable ? 'secondary' : 'grey-lighten-1'"
                variant="flat"
                :max-width="500"
                class="mt-2"
                :class="{ 'text-decoration-line-through': !isAvailable }"
                :disabled="!isAvailable"
                @click="
                  router.push({
                    name: 'checkout',
                  })
                "
              >
<!--                    params: { productId: product.id },-->
                Buy Now
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
              <div v-if="product.images?.length" class="mt-3 d-none d-md-block">
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
        <no-items v-else />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>
