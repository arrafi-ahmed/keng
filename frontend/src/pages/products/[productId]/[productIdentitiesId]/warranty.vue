<script setup>
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import Warranty from "@/models/Warranty.js";
import PageTitle from "@/components/PageTitle.vue";
import DatePicker from "@/components/DatePicker.vue";

definePage({
  name: "product-warranty",
  meta: {
    layout: "default",
    title: "Product Warranty",
    requiresAuth: true,
  },
});
const store = useStore();
const route = useRoute();
const router = useRouter();

const warranty = computed(() => store.state.product.warranty);
const newWarranty = reactive({
  ...new Warranty(),
  productIdentitiesId: route.params.productIdentitiesId,
});

const form = ref(null);
const isFormValid = ref(true);

const handleSubmitWarrantySave = async () => {
  await form.value.validate();
  if (!isFormValid.value) return;

  store.dispatch("product/saveWarranty", { newWarranty }).then((res) => {
    router.push({ name: "products" });
  });
};
const fetchData = async () => {
  await store.dispatch("product/setWarranty", {
    productIdentitiesId: route.params.productIdentitiesId,
  });
};
onMounted(async () => {
  await fetchData();
  Object.assign(newWarranty, {
    ...warranty.value,
  });
});
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
          title="Product Warranty"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-form
          ref="form"
          v-model="isFormValid"
          fast-fail
          @submit.prevent="handleSubmitWarrantySave"
        >
          <date-picker
            v-model="newWarranty.warrantyStartDate"
            :rules="[(v) => !!v || 'Warranty Start Date is required!']"
            clearable
            custom-class="mt-2 mt-md-4"
            density="comfortable"
            hide-details="auto"
            label="Warranty Start Date"
            rounded="lg"
            variant="outlined"
          />
          <date-picker
            v-model="newWarranty.warrantyExpirationDate"
            :rules="[(v) => !!v || 'Warranty Expiration Date is required!']"
            clearable
            custom-class="mt-2 mt-md-4"
            density="comfortable"
            hide-details="auto"
            label="Warranty Expiration Date"
            rounded="lg"
            variant="outlined"
          />
          <v-select
            v-model="newWarranty.authenticityConfirmation"
            :items="[
              { title: 'Yes', value: true },
              { title: 'No', value: false },
            ]"
            class="mt-2 mt-md-4"
            density="comfortable"
            hide-details="auto"
            item-title="title"
            item-value="value"
            label="Authenticity Confirmation"
            rounded="lg"
            variant="outlined"
          />
          <v-textarea
            v-model="newWarranty.warrantyConditions"
            class="mt-2 mt-md-4 text-pre-wrap"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Warranty Conditions"
            rounded="lg"
            variant="outlined"
          />
          <v-textarea
            v-model="newWarranty.voidConditions"
            class="mt-2 mt-md-4 text-pre-wrap"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Void Conditions"
            rounded="lg"
            variant="outlined"
          />
          <v-textarea
            v-model="newWarranty.supportContact"
            class="mt-2 mt-md-4 text-pre-wrap"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Support Contact"
            rounded="lg"
            variant="outlined"
          />
          <v-textarea
            v-model="newWarranty.usageAdvice"
            class="mt-2 mt-md-4 text-pre-wrap"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Usage Advice"
            rounded="lg"
            variant="outlined"
          />

          <v-card-actions class="mt-2 mt-md-4">
            <v-spacer />
            <v-btn
              color="primary"
              rounded="lg"
              size="large"
              type="submit"
              variant="flat"
            >
              Save
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>
