<script setup>
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import { useTheme } from "vuetify/framework";
import QRCodeVue3 from "qrcode-vue3";
import PageTitle from "@/components/PageTitle.vue";

definePage({
  name: "qrcode-view",
  meta: {
    layout: "default",
    title: "View QRCode",
    requiresAuth: true,
  },
});
const store = useStore();
const route = useRoute();
const router = useRouter();
const theme = useTheme();

const productId = computed(() => route.params.productId);
const uuid = computed(() => route.params.uuid);

const qrCode = computed(() => {
  return JSON.stringify({
    id: productId.value,
    uuid: uuid.value,
  });
});

const qrOptions = {
  type: "dot",
  color: theme.global.current.value.colors.primary,
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
          title="View QRCode"
        />
      </v-col>
    </v-row>
    <v-row
      align="center"
      justify="center"
    >
      <v-col cols="auto mt-5">
        <QRCodeVue3
          v-if="productId && uuid"
          :corners-square-options="qrOptions"
          :dots-options="qrOptions"
          :download="true"
          :value="qrCode"
          :height="250"
          :width="250"
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
