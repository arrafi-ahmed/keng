<script setup>
import { useRoute } from "vue-router";
import { useTheme } from "vuetify/framework";
import QRCodeVue3 from "qrcode-vue3";
import PageTitle from "@/components/PageTitle.vue";
import { clientBaseUrl } from "@/others/util.js";

definePage({
  name: "qrcode-view-product-identity",
  meta: {
    layout: "default",
    title: "View Unit QR Code",
    requiresAuth: true,
  },
});
const route = useRoute();
const theme = useTheme();

const productId = computed(() => route.params.productId);
const productIdentitiesId = computed(() => route.params.productIdentitiesId);
const uuid = computed(() => route.params.uuid);

const qrCode = computed(() => {
  const params = new URLSearchParams();
  params.append('uuid', uuid.value)
  params.append('scanned', 1)

  const route = `${clientBaseUrl}/products/${productId.value}/${productIdentitiesId.value}?${params.toString()}`;
  return route;
});

const qrOptions = {
  type: "dot",
  color: theme.global.current.value.colors.secondary,
  margin: 20,
};
</script>

<template>
  <v-container>
    <v-row
      align="center"
      justify="space-between"
    >
      <v-col>
        <page-title
          :border-b="true"
          :show-back="true"
          title="Unit QR Code"
        />
      </v-col>
    </v-row>
    <v-row
      align="center"
      justify="center"
    >
      <v-col cols="auto mt-5">
        <QRCodeVue3
          v-if="productIdentitiesId && uuid"
          :corners-square-options="qrOptions"
          :dots-options="qrOptions"
          :download="true"
          :value="qrCode"
          :height="250"
          :width="250"
          :margin="10"
          download-button="v-btn v-btn--block bg-primary v-btn--density-default v-btn--variant-flat mt-2"
        />
        <v-alert
          v-else
          border="start"
          closable
          density="compact"
        >
          No data available!
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>
