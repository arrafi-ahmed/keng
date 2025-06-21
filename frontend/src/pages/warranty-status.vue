<script setup>
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import PageTitle from "@/components/PageTitle.vue";
import { useDisplay } from "vuetify";

definePage({
  name: "warranty-status",
  meta: {
    requiresAuth: true,
    layout: "default",
  },
});

const store = useStore();
const router = useRouter();
const { xs } = useDisplay();

const productIdentity = computed(() => store.state.product.productIdentity);

const form = ref(null);
const isFormValid = ref(true);

const serial = ref("");

const handleSubmitCheckWarrantyStatus = async () => {
  await store.dispatch("product/setProductIdentity", {
    identityNo: serial.value,
  });
  if (!productIdentity.value?.id) {
    store.commit("addSnackbar", {
      text: "Invalid Serial!",
      color: "error",
    });
  }
  router.push({
    name: "product-identity-single-landing",
    params: {
      productId: productIdentity.value.productId,
      productIdentitiesId: productIdentity.value.id,
    },
    query: {
      uuid: productIdentity.value.uuid,
    },
  });
};
</script>

<template>
  <v-container>
    <v-row align="center" justify="space-between">
      <v-col>
        <page-title :border-b="true" :show-back="true" title="Check Warranty">
        </page-title>
      </v-col>
    </v-row>

    <v-row justify="center">
      <v-col cols="12" lg="6" md="7" sm="8" xl="5">
        <v-form
          ref="form"
          v-model="isFormValid"
          fast-fail
          @submit.prevent="handleSubmitCheckWarrantyStatus"
        >
          <v-text-field
            v-model="serial"
            :rules="[(v) => !!v || 'Serial is required!']"
            clearable
            hide-details="auto"
            label="Serial"
            rounded="lg"
            variant="outlined"
          />
          <v-btn
            :density="xs ? 'comfortable' : 'default'"
            block
            class="mt-2"
            color="primary"
            rounded="lg"
            size="large"
            type="submit"
            variant="elevated"
          >
            Check
          </v-btn>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>
