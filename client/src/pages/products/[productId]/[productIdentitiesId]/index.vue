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

    const newScan = {
      scannedAt: timestamp,
      location: { latitude, longitude },
      productId: productId.value,
      productIdentitiesId: productIdentitiesId.value,
    };

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

onMounted(async () => {
  await fetchData();
  document.title = `${product.value.name || "Product View"} | ${appInfo.name}`;
  // currentSelectedImage.value = product.value.images[0];
});
</script>

<template>
  <v-container class="fill-height d-block">
    <v-row
      justify="center"
      align="center"
    >
      <v-col
        cols="12"
        lg="8"
      >
        <v-sheet
          v-if="product?.id"
          class="px-3"
          rounded
          :elevation="3"
        >
          <v-row
            align="start"
            justify="center"
          >
            <v-col
              cols="12"
              sm="10"
              md="6"
              order-md="2"
            >
              <h1>{{ product.name }}</h1>
              <div class="text-truncate-multi-line mt-2">
                {{ product.description }}
              </div>
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
              <div
                v-if="product.images?.length"
                class="mt-2 d-none d-md-block"
              >
                <div>Product Images</div>
                <v-slide-group
                  class="py-4"
                  show-arrows
                >
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
            <v-col
              cols="12"
              sm="10"
              md="5"
              order-md="1"
            >
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
      </v-col>
    </v-row>

    <v-row justify="center">
      <v-col
        cols="12"
        lg="8"
      >
        <v-sheet
          v-if="warranty?.id"
          class="px-3 mt-4"
          rounded
          :elevation="3"
        >
          <v-row
            align="start"
            justify="center"
          >
            <v-col
              cols="12"
              md="11"
            >
              <h2>Warranty Information</h2>
              <v-list>
                <v-list-item
                  title="Start Date"
                  :subtitle="formatDate(warranty.warrantyStartDate)"
                />
                <v-list-item
                  title="Expiration Date"
                  :subtitle="formatDate(warranty.warrantyExpirationDate)"
                />
                <v-list-item
                  title="Authenticity Confirmation"
                  :subtitle="warranty.authenticityConfirmation ? 'Yes' : 'No'"
                />
                <v-list-item
                  title="Warranty Conditions"
                  :subtitle="warranty.warrantyConditions"
                  class="text-pre-wrap"
                />
                <v-list-item
                  title="Void Conditions"
                  :subtitle="warranty.voidConditions"
                  class="text-pre-wrap"
                />
                <v-list-item
                  title="Support Contact"
                  :subtitle="warranty.supportContact"
                  class="text-pre-wrap"
                />
                <v-list-item
                  title="Usage Advice"
                  :subtitle="warranty.usageAdvice"
                  class="text-pre-wrap"
                />
              </v-list>
            </v-col>
          </v-row>
        </v-sheet>
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
