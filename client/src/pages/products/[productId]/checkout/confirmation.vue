<script setup>
import { useRouter } from "vue-router";
import { useStore } from "vuex";

definePage({
  name: "checkout-confirmation",
  meta: {
    layout: "default",
    title: "Checkout Confirmation",
    requiresAuth: false,
  },
});
const store = useStore();
const router = useRouter();

const goHome = () => {
  router.push({ name: "home" });
};
</script>
<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card
      class="text-center pa-6"
      color="surface"
      elevation="6"
      max-width="500"
      rounded="lg"
    >
      <v-icon class="mb-4" color="secondary" size="64"
        >mdi-check-circle-outline
      </v-icon>
      <h2 class="text-h5 text-white">Payment Processing</h2>
      <p class="text-body-2 text-white text-medium-emphasis mt-2">
        Thank you! Your payment is being processed. You’ll receive confirmation
        email shortly.
      </p>

      <v-divider class="my-4" />

      <v-btn
        class="mt-2"
        color="primary"
        variant="flat"
        @click="router.push(store.getters['user/calcHome'])"
      >
        Return to Home
      </v-btn>
    </v-card>
  </v-container>
</template>
