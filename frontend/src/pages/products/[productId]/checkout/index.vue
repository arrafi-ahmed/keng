<script setup>
import { onMounted, ref } from "vue";
import $axios from "@/plugins/axios.js";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import PageTitle from "@/components/PageTitle.vue";
import { loadStripe } from "@stripe/stripe-js";
import { defaultCurrency, getClientPublicImageUrl } from "@/others/util.js";
import { useTheme } from "vuetify";

definePage({
  name: "checkout",
  meta: {
    layout: "default",
    title: "Checkout",
    requiresAuth: true,
  },
});

const route = useRoute();
const router = useRouter();
const store = useStore();
const theme = useTheme();

const elementsAppearance = {
  theme: "night",
  variables: {
    colorPrimary: theme.current.value.colors.secondary,
    colorBackground: theme.current.value.colors.background,
    colorText: theme.current.value.colors["on-surface"],
    colorTextSecondary: "#A7B7C2", // You can also map this if needed
    colorDanger: theme.current.value.colors.error,
    borderRadius: "6px",
    fontFamily: "Inter, sans-serif",
    spacingUnit: "5px",
  },
  rules: {
    ".Input": {
      backgroundColor: theme.current.value.colors.surface,
      border: `1px solid ${theme.current.value.colors.header}`,
      color: theme.current.value.colors["on-surface"],
    },
    ".Input:focus": {
      borderColor: theme.current.value.colors.secondary,
      boxShadow: `0 0 0 1px ${theme.current.value.colors.secondary}`,
    },
    ".Label": {
      color: "#A7B7C2",
    },
  },
};

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
let stripe = null;
const elements = ref(null);
const card = ref(null);

const isCardMounted = ref(false);
const cardElement = ref(null);
const fetchedClientSecret = ref("");
const fetchedProduct = ref({});

const pay = async () => {
  const { error, paymentIntent } = await stripe.confirmPayment({
    elements: elements.value,
    confirmParams: {
      // Only needed if you want to redirect
      return_url: `${import.meta.env.VITE_BASE_URL}${
        router.resolve({
          name: "checkout-confirmation",
          params: { productId: route.params.productId },
        }).href
      }`,
    },
    redirect: "if_required",
  });

  if (error) {
    store.commit("addSnackbar", { text: error.message, color: "error" });
  } else if (paymentIntent.status === "succeeded") {
    store.commit("addSnackbar", {
      text: "Payment successful!",
      color: "success",
    });
    router.push({
      name: "checkout-confirmation",
      params: { productId: route.params.productId },
    });
  }
};

onMounted(async () => {
  try {
    stripe = await loadStripe(publishableKey);
    const result = await $axios.post("/stripe/createPaymentIntent", {
      productId: route.params.productId,
    });
    fetchedProduct.value = result.data.payload?.product;
    fetchedClientSecret.value = result.data.payload?.clientSecret;

    elements.value = stripe.elements({
      clientSecret: fetchedClientSecret.value,
      appearance: elementsAppearance,
    });

    card.value = elements.value.create("payment");
    card.value.mount(cardElement.value);

    card.value.on("ready", () => {
      isCardMounted.value = true;
    });
  } catch (err) {
    console.error("Failed to create PaymentIntent:", err);
    store.commit("addSnackbar", {
      text: "Failed to create payment",
      color: "error",
    });
  }
});
</script>
<template>
  <v-container>
    <v-row>
      <v-col>
        <page-title :border-b="true" :show-back="true" title="Checkout" />
      </v-col>
    </v-row>

    <v-row align="center" justify="center">
      <v-col cols="12" md="8" sm="10">
        <v-card v-if="fetchedProduct.id" :max-width="600" class="mx-auto" tile>
          <v-card-title>{{ fetchedProduct.name }}</v-card-title>
          <v-card-subtitle>{{ fetchedProduct.description }}</v-card-subtitle>
          <v-card-text>
            <h3>{{ defaultCurrency.symbol }} {{ fetchedProduct.price }}</h3>
          </v-card-text>
        </v-card>
        <v-card :max-width="600" class="mx-auto" tile>
          <v-card-text>
            <div ref="cardElement"></div>
          </v-card-text>
          <v-card-actions>
            <v-btn
              v-if="isCardMounted"
              block
              color="primary"
              variant="flat"
              @click="pay"
              >Pay Now
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-row justify="center">
      <v-col class="text-center" cols="2">
        <v-img
          v-if="isCardMounted"
          :src="getClientPublicImageUrl('stripe.svg')"
          alt="Powered by Stripe"
          contain
        />
      </v-col>
    </v-row>
  </v-container>
</template>
