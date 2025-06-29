<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { useDisplay } from "vuetify";
import PageTitle from "@/components/PageTitle.vue";
import { getClientPublicImageUrl } from "@/others/util.js";

definePage({
  name: "importExport", // Set the route name to 'signin'
  meta: {
    layout: "default",
    title: "Products Import/Export",
    requiresAuth: true,
  },
});

const { mobile } = useDisplay();
const store = useStore();
const router = useRouter();

const productImportDialog = ref(false);
const productImportForm = ref(null);
const isProductImportFormValid = ref(true);
const productImportZip = ref(null);

const warrantyImportDialog = ref(false);
const warrantyImportForm = ref(null);
const isWarrantyImportFormValid = ref(true);
const warrantyImportExcel = ref(null);

const handleWarrantyImport = async () => {
  if (!warrantyImportExcel.value) {
    store.commit("addSnackbar", {
      text: "Excel file required!",
      color: "error",
    });
    return;
  }
  const formData = new FormData();
  formData.append("warrantyImportExcel", warrantyImportExcel.value);
  store.dispatch("product/bulkImportWarranty", formData).then((result) => {
    router.push({ name: "products" });
  });
};

const handleProductImport = async () => {
  if (!productImportZip.value) {
    store.commit("addSnackbar", {
      text: "Zip file required!",
      color: "error",
    });
    return;
  }

  const formData = new FormData();
  formData.append("productImportZip", productImportZip.value);
  store.dispatch("product/bulkImportProduct", formData).then((result) => {
    router.push({ name: "products" });
  });
};
const handleExport = async () => {
  await store.dispatch("product/bulkExport");
};
</script>

<template>
  <v-container>
    <v-row align="center" justify="center">
      <v-col>
        <page-title
          :border-b="true"
          :show-back="true"
          title="Import / Export"
        />
        <v-card
          class="mx-auto pa-4 pa-md-8 my-4"
          elevation="0"
          max-width="700"
          rounded="lg"
        >
          <v-card-title class="text-center font-weight-bold">
            <h2>Product Import</h2>
          </v-card-title>
          <v-card-subtitle
            class="text-center v-icon--clickable text-decoration-underline"
            @click="productImportDialog = !productImportDialog"
          >
            <v-icon>mdi-information-outline</v-icon>
            Import instruction
          </v-card-subtitle>
          <v-card-text>
            <v-form
              ref="productImportForm"
              v-model="isProductImportFormValid"
              fast-fail
              @submit.prevent="handleProductImport"
            >
              <v-file-upload
                v-model="productImportZip"
                :hide-browse="false"
                accept=".zip"
                class="mt-2 mt-md-4"
                clearable
                density="compact"
                show-size
                title="Upload zip"
                variant="compact"
              />

              <v-btn
                :density="mobile ? 'comfortable' : 'default'"
                block
                class="mt-2 mt-md-4"
                color="primary"
                rounded="lg"
                size="large"
                type="submit"
              >
                Import Now
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <v-card
          class="mx-auto pa-4 pa-md-8 my-2 my-md-5"
          elevation="0"
          max-width="700"
          rounded="lg"
        >
          <v-card-title class="text-center font-weight-bold">
            <h2>Product Export</h2>
          </v-card-title>
          <v-card-subtitle class="text-center">
            Exports all product data including images, manuals, etc
          </v-card-subtitle>
          <v-card-text>
            <v-btn
              :density="mobile ? 'comfortable' : 'default'"
              block
              class="mt-2 mt-md-4"
              color="primary"
              rounded="lg"
              size="large"
              @click="handleExport"
            >
              Export ZIP
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card
          class="mx-auto pa-4 pa-md-8 my-4"
          elevation="0"
          max-width="700"
          rounded="lg"
        >
          <v-card-title class="text-center font-weight-bold">
            <h2>Warranty Import</h2>
          </v-card-title>
          <v-card-subtitle
            class="text-center v-icon--clickable text-decoration-underline"
            @click="warrantyImportDialog = !warrantyImportDialog"
          >
            <v-icon>mdi-information-outline</v-icon>
            Import instruction
          </v-card-subtitle>
          <v-card-text>
            <v-form
              ref="warrantyImportForm"
              v-model="isWarrantyImportFormValid"
              fast-fail
              @submit.prevent="handleWarrantyImport"
            >
              <v-file-upload
                v-model="warrantyImportExcel"
                :hide-browse="false"
                accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                class="mt-2 mt-md-4"
                clearable
                density="compact"
                show-size
                title="Upload excel"
                variant="compact"
              />

              <v-btn
                :density="mobile ? 'comfortable' : 'default'"
                block
                class="mt-2 mt-md-4"
                color="primary"
                rounded="lg"
                size="large"
                type="submit"
              >
                Import Now
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <v-dialog v-model="productImportDialog" :max-width="600">
    <v-card>
      <v-card-title>How to Prepare Your Import Files</v-card-title>
      <v-card-text class="text-pre-wrap">
        <ul class="mx-3 import-instruction">
          <li>Ensure all filenames are unique to avoid conflicts.</li>
          <li>
            <div class="mb-3">
              Organize your ZIP file with the following folder structure:
            </div>
            <code>
              {{
                `import.zip
├── product-images/
│    ├── image1.jpg
│    ├── image2.png
│    └── ...
├── product-certificates/
│    ├── cert1.pdf
│    ├── cert2.pdf
│    └── ...
├── product-manuals/
│    ├── manual1.pdf
│    ├── manual2.pdf
│    └── ...
└── products.xlsx`
              }}</code
            >
          </li>
          <li>
            <div class="mb-3">
              In <code>products.xlsx</code>, include the following columns:
            </div>
            <code
              >name description price identities images manuals certificates
            </code>
            <v-img
              :src="getClientPublicImageUrl('excel-demo-import-product.png')"
              class="mt-3"
            ></v-img>
            <div class="d-flex justify-center">
              <v-btn
                :href="getClientPublicImageUrl('excel-demo-import-product.png')"
                :ripple="false"
                class="mx-auto"
                icon
                size="x-small"
                target="_blank"
                variant="plain"
              >
                (+) View full size
              </v-btn>
            </div>
          </li>
        </ul>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="secondary"
          variant="flat"
          @click="productImportDialog = !productImportDialog"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="warrantyImportDialog" :max-width="600">
    <v-card>
      <v-card-title>How to Prepare Your Import File</v-card-title>
      <v-card-text class="text-pre-wrap">
        <ul class="mx-3 import-instruction">
          <li>
            <div class="mb-3">
              In excel file, include the following columns:
            </div>
            <code
              >identity start end authenticity warranty_conditions
              void_conditions support_contact usage_advice
            </code>
            <v-img
              :src="getClientPublicImageUrl('excel-demo-import-warranty.png')"
              class="mt-3"
            ></v-img>
            <div class="d-flex justify-center">
              <v-btn
                :href="
                  getClientPublicImageUrl('excel-demo-import-warranty.png')
                "
                :ripple="false"
                class="mx-auto"
                icon
                size="x-small"
                target="_blank"
                variant="plain"
              >
                (+) View full size
              </v-btn>
            </div>
          </li>
        </ul>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="secondary"
          variant="flat"
          @click="warrantyImportDialog = !warrantyImportDialog"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style>
.import-instruction li {
  margin-bottom: 0.5rem;
}
</style>
