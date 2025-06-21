<script setup>
import {
  apiBaseUrl,
  defaultCurrency,
  downloadFile,
  getProductImageUrl,
} from "@/others/util.js";
import { useDisplay } from "vuetify/framework";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

const { smAndDown } = useDisplay();
const router = useRouter();
const store = useStore();

const { product, showBuy } = defineProps(["product", "showBuy"]);

const isAvailable = computed(() => Number(product?.availableStock) > 0)
const isManualAvailable = computed(() => !!product.files?.[0]?.filename);

const handleDownloadManual = async () => {
  const filename = product.files?.[0]?.filename;
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

const expanded = ref(false);
const showToggle = ref(true); // Always show toggle for simplicity
const textRef = ref(null);

const toggle = () => {
  expanded.value = !expanded.value;
};
const checkOverflow = () => {
  const el = textRef.value;
  if (el) {
    showToggle.value = el.scrollHeight > el.offsetHeight + 1;
  }
};
onMounted(async () => {
  checkOverflow();
});
</script>

<template>
  <v-sheet v-if="product?.id" :elevation="3" class="px-3 mt-4 mt-md-6" rounded>
    <v-row align="start" justify="center">
      <v-col cols="12" md="6" order-md="2" sm="10">
        <h1>{{ product.name }}</h1>
        <div :class="{ 'text-truncate-multi-line': !expanded }" ref="textRef">
          {{ product.description }}
        </div>
        <v-btn
          v-if="showToggle"
          class="mt-2"
          size="x-small"
          variant="outlined"
          @click="toggle"
        >
          {{ expanded ? "Read less" : "Read more" }}
        </v-btn>

        <template v-if="showBuy">
          <h3 class="font-weight-medium mt-2">
            {{ defaultCurrency.symbol }}{{ product.price }}
          </h3>
          <div
            v-if="product.availableStock > 0 && product.availableStock < 5"
            class="text-error text-center mt-2"
          >
            Only {{ product.availableStock }} left in stock!
          </div>
          <div
            v-else-if="product.availableStock == 0"
            class="text-error text-center mt-2"
          >
            Out of stock!
          </div>
          <v-btn
            :class="{ 'text-decoration-line-through': !isAvailable }"
            :color="isAvailable ? 'primary' : 'grey-lighten-1'"
            :disabled="!isAvailable"
            :max-width="500"
            block
            class="mt-2"
            variant="flat"
            @click="
              router.push({
                name: 'checkout',
              })
            "
          >
            Buy Now
          </v-btn>
        </template>
        <v-btn
          :max-width="500"
          block
          class="mt-2"
          :class="{ 'text-decoration-line-through': !isManualAvailable }"
          :color="isManualAvailable ? 'secondary' : 'grey-lighten-1'"
          variant="flat"
          :disabled="!isManualAvailable"
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
                :border="isSelected ? 'secondary opacity-100 lg' : ''"
                class="rounded ml-2"
                @click="toggle"
              >
                <v-img
                  :height="80"
                  :src="getProductImageUrl(image.filename)"
                  :width="80"
                  cover
                  @click="changeSelectedImage(index)"
                />
              </v-card>
            </v-slide-group-item>
          </v-slide-group>
        </div>
      </v-col>
      <v-col cols="12" md="5" order-md="1" sm="10">
        <v-carousel
          v-model="imageCarousel"
          :show-arrows="smAndDown === true"
          class="mt-2"
          hide-delimiters
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
              class="opacity-50"
              color="grey-darken-2"
              density="comfortable"
              icon="mdi-chevron-left"
              size="small"
              @click="props.onClick"
            />
          </template>
          <template #next="{ props }">
            <v-btn
              class="opacity-50"
              color="grey-darken-2"
              density="comfortable"
              icon="mdi-chevron-right"
              size="small"
              @click="props.onClick"
            />
          </template>
        </v-carousel>
      </v-col>
    </v-row>
  </v-sheet>
</template>

<style scoped></style>
