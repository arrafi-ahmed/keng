<script setup>
import PageTitle from "@/components/PageTitle.vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import Product from "@/models/Product.js";
import ProductIdentity from "@/models/ProductIdentity.js";
import FileUploader from "@/components/FileUploader.vue";

definePage({
  name: "product-edit",
  meta: {
    layout: "default",
    title: "Edit Product",
    requiresAuth: true,
  },
});
const store = useStore();
const route = useRoute();
const router = useRouter();

const product = computed(() => store.state.product.product);
const newProduct = reactive({ ...new Product() });
const removeFiles = reactive({
  productImages: [],
  productFiles: [],
});
const form = ref(null);
const isFormValid = ref(true);

const addMoreProductIdentities = () => {
  newProduct.productIdentities = newProduct.productIdentities.concat(
    new ProductIdentity(),
  );
};
const handleSubmitProductEdit = async () => {
  await form.value.validate();
  if (!isFormValid.value) return;

  const formData = new FormData();
  formData.append("id", newProduct.id);
  formData.append("name", newProduct.name);
  formData.append("description", newProduct.description);
  formData.append("price", newProduct.price);
  formData.append(
    "productIdentities",
    JSON.stringify(newProduct.productIdentities),
  );
  formData.append(
    "removeFiles",
    JSON.stringify(removeFiles),
  );
  if (newProduct.productImages?.length > 0) {
    newProduct.productImages.forEach((file) => {
      formData.append("productImages", file);
    });
  }
  if (newProduct.certificates?.length > 0) {
    newProduct.certificates.forEach((file) => {
      formData.append("productCertificates", file);
    });
  }
  if (newProduct.manuals?.length > 0) {
    newProduct.manuals.forEach((file) => {
      formData.append("productManuals", file);
    });
  }

  store.dispatch("product/save", formData).then((res) => {
    router.push({ name: "products" });
  });
};

const fetchData = async () => {
  await store.dispatch("product/setProduct", {
    productId: route.params.productId,
  });
};
const uploaded = reactive({
  certificates: [],
  manuals: [],
});
onMounted(async () => {
  await fetchData();
  Object.assign(newProduct, {
    ...product.value,
    productImages: [],
    productFiles: [],
    certificates: [],
    manuals: [],
  });
  newProduct.productIdentities = product.value.productIdentities || []
  uploaded.certificates = product.value.productFiles?.filter(
    (item) => item.fileType === 10,
  );
  uploaded.manuals = product.value.productFiles?.filter(
    (item) => item.fileType === 11,
  );
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
          title="Edit Product"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-form
          ref="form"
          v-model="isFormValid"
          fast-fail
          @submit.prevent="handleSubmitProductEdit"
        >
          <v-text-field
            v-model="newProduct.name"
            :rules="[(v) => !!v || 'Name is required!']"
            class="mt-2"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Name"
            rounded="lg"
            variant="outlined"
          />
          <v-textarea
            v-model="newProduct.description"
            :rules="[(v) => !!v || 'Description is required!']"
            class="mt-2 mt-md-4"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Description"
            rounded="lg"
            variant="outlined"
          />
          <v-text-field
            v-model="newProduct.price"
            :rules="[(v) => !!v || 'Price is required!']"
            class="mt-2 mt-md-4"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Price"
            rounded="lg"
            type="number"
            variant="outlined"
          />
          <v-card class="mt-2 mt-md-4">
            <v-card-title>Product Identities</v-card-title>
            <v-card-text class="pb-0">
              <v-text-field
                v-for="(identity, index) in newProduct.productIdentities"
                :key="index"
                v-model="identity.identityNo"
                :label="`Serial #${index + 1}`"
                :rules="[(v) => !!v || 'Serial is required!']"
                class="mt-2 mt-md-4"
                clearable
                density="comfortable"
                hide-details="auto"
                rounded="lg"
                variant="outlined"
              />
            </v-card-text>
            <v-card-actions class="pt-0">
              <v-btn
                class="mt-0"
                color="primary"
                rounded="lg"
                size="small"
                @click="addMoreProductIdentities"
              >
                Add More Serial
              </v-btn>
            </v-card-actions>
          </v-card>

          <file-uploader
            v-model:uploading="newProduct.productImages"
            v-model:to-remove="removeFiles.productImages"
            title="Product Images"
            :uploaded="product.productImages"
            file-prefix="product-images"
          />
          <file-uploader
            v-model:uploading="newProduct.certificates"
            v-model:to-remove="removeFiles.productFiles"
            title="Product certificates"
            :uploaded="uploaded.certificates"
            file-prefix="product-certificates"
            variant="file"
          />
          <file-uploader
            v-model:uploading="newProduct.manuals"
            v-model:to-remove="removeFiles.productFiles"
            title="Product manuals"
            :uploaded="uploaded.manuals"
            file-prefix="product-manuals"
            variant="file"
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
