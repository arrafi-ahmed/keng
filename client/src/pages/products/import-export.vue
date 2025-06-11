<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { isValidEmail } from "@/others/util";
import { useDisplay } from "vuetify";
import PageTitle from "@/components/PageTitle.vue";

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

const instructionDialog = ref(false);
const form = ref(null);
const isFormValid = ref(true);
const importZip = ref(null);

const handleImport = async () => {
  if (!importZip.value) {
    store.commit("addSnackbar", {
      text: "Zip file required!",
      color: "error",
    });
    return;
  }

  const formData = new FormData();
  formData.append("importZip", importZip.value);
  store.dispatch("product/bulkImport", formData).then((result) => {
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
          title="Product Import/Export"
        />
        <v-card
          class="mx-auto pa-4 pa-md-8 my-2 my-md-5"
          elevation="0"
          max-width="700"
          rounded="lg"
        >
          <v-card-title class="text-center font-weight-bold">
            <h2>Import</h2>
          </v-card-title>
          <v-card-subtitle
            class="text-center v-icon--clickable text-decoration-underline"
            @click="instructionDialog = !instructionDialog"
          >
            <v-icon>mdi-information-outline</v-icon>
            Import instruction
          </v-card-subtitle>
          <v-card-text>
            <v-form
              ref="form"
              v-model="isFormValid"
              fast-fail
              @submit.prevent="handleImport"
            >
              <v-file-upload
                v-model="importZip"
                :hide-browse="false"
                class="mt-2 mt-md-4"
                accept=".zip"
                show-size
                clearable
                density="compact"
                title="Upload zip"
                variant="compact"
              />

              <v-btn
                :density="mobile ? 'comfortable' : 'default'"
                class="mt-2 mt-md-4"
                block
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
            <h2>Export</h2>
          </v-card-title>
          <v-card-subtitle class="text-center">
            Exports all product data including images, manuals, etc
          </v-card-subtitle>
          <v-card-text>
            <v-btn
              :density="mobile ? 'comfortable' : 'default'"
              class="mt-2 mt-md-4"
              block
              color="primary"
              rounded="lg"
              size="large"
              @click="handleExport"
            >
              Export ZIP
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <v-dialog v-model="instructionDialog" :width="450">
    <v-card>
      <v-card-title>Import instructions</v-card-title>
      <v-card-text class="text-pre-wrap">
        <ul class="mx-3">
          <li>Keep all the file name unique.
          </li>
          <li>
            <div>Maintain folder structure like below:</div>
            <code>{{
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
            }}</code>
          </li>

        </ul>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="flat" @click="instructionDialog = !instructionDialog">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style></style>
