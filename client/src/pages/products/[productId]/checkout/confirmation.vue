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
      elevation="6"
      rounded="lg"
      color="surface"
      max-width="500"
    >
      <v-icon size="64" color="secondary" class="mb-4"
        >mdi-check-circle-outline
      </v-icon>
      <h2 class="text-h5 text-white">Payment Processing</h2>
      <p class="text-body-2 text-white text-medium-emphasis mt-2">
        Thank you! Your payment is being processed. You’ll receive confirmation
        email shortly.
      </p>

      <v-divider class="my-4" />

      <v-btn
        color="secondary"
        variant="flat"
        class="mt-2"
        @click="router.push(store.getters['user/calcHome'])"
      >
        Return to Home
      </v-btn>
    </v-card>
  </v-container>
</template>
