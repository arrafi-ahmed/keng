<script setup>
import { onMounted, ref } from "vue";
import $axios from "@/plugins/axios.js";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import PageTitle from "@/components/PageTitle.vue";
import { loadStripe } from "@stripe/stripe-js";
import { defaultCurrency } from "@/others/util.js";

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

const elementsAppearance = {
  theme: "night", // built-in dark base
  variables: {
    colorPrimary: "#5C9EFF",
    colorBackground: "#10141A",
    colorText: "#ffffff",
    colorTextSecondary: "#cccccc",
    colorDanger: "#EF4444",

    borderRadius: "8px",
    fontFamily: "Inter, sans-serif",
    spacingUnit: "5px",
  },
  rules: {
    ".Input": {
      backgroundColor: "#1A1F28",
      border: "1px solid #2A3A4A",
      boxShadow: "none",
      color: "#ffffff",
    },
    ".Input:focus": {
      borderColor: "#5C9EFF",
      boxShadow: "0 0 0 1px #5C9EFF",
    },
    ".Label": {
      color: "#cccccc",
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
  console.log(
    6,
    router.resolve({
      name: "checkout-confirmation",
      params: { productId: route.params.productId },
    }).href,
  );
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
    const result = await $axios.post("/api/stripe/createPaymentIntent", {
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
        <page-title title="Checkout" :show-back="true" :border-b="true" />
      </v-col>
    </v-row>

    <v-row align="center" justify="center">
      <v-col cols="12" md="8" sm="10">
        <v-card :max-width="600" class="mx-auto" v-if="fetchedProduct.id">
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
              color="secondary"
              variant="flat"
              block
              @click="pay"
              >Pay Now
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
