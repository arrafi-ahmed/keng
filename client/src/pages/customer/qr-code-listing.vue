<script setup>
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import PageTitle from "@/components/PageTitle.vue";
import { formatDate } from "@/others/util.js";
import QrCode from "@/models/QrCode.js";
import { useDisplay } from "vuetify";
import QRCodeVue3 from "qrcode-vue3";
import { useTheme } from "vuetify/framework";

definePage({
  name: "qr-code-listing",
  meta: {
    requiresAuth: true,
    layout: "default",
  },
});

const store = useStore();
const router = useRouter();
const { xs } = useDisplay();
const theme = useTheme();

const qrCodes = computed(() => store.state.customerInsights.qrCodes);
const addQrDialog = ref(false);
const viewQrDialog = ref(false);
const addQrForm = ref(null);
const isFormValid = ref(true);

const itemsPerPage = ref(10);
const totalCount = ref(0);
const loading = ref(false);
const headers = ref([
  {
    title: "Title",
    align: "start",
    key: "title",
  },
  {
    title: "Created At",
    align: "start",
    key: "createdAt",
  },
]);
const newQrCode = reactive({ ...new QrCode() });

const selectedQrCode = reactive({ ...new QrCode() });

const qrOptions = {
  type: "dot",
  color: theme.global.current.value.colors.secondary,
  margin: 20,
};

const openViewQrDialog = (event, { item }) => {
  viewQrDialog.value = !viewQrDialog.value;
  Object.assign(selectedQrCode, { ...item });
};

const loadItems = ({ page, itemsPerPage }) => {
  loading.value = true;
  return store
    .dispatch("customerInsights/setQrCodes", {
      page,
      itemsPerPage,
      fetchTotalCount: !qrCodes.value?.items,
    })
    .then(({ total }) => {
      totalCount.value = total;
    })
    .finally(() => {
      loading.value = false;
    });
};

const handleSubmitAddQrCode = async () => {
  await addQrForm.value.validate();
  if (!isFormValid.value) return;

  await store
    .dispatch("customerInsights/saveQrCode", { newQrCode })
    .then(() => {
      Object.assign(newQrCode, { ...new QrCode() });
      addQrDialog.value = !addQrDialog.value;
    });
};
</script>

<template>
  <v-container>
    <v-row align="center" justify="space-between">
      <v-col>
        <page-title :border-b="true" :show-back="true" title="QR Codes">
          <v-row align="center">
            <v-menu>
              <template #activator="{ props }">
                <v-btn icon="mdi-dots-vertical" v-bind="props" variant="text" />
              </template>
              <v-list density="compact">
                <v-list-item
                  density="compact"
                  prepend-icon="mdi-plus"
                  title="Add QR Code"
                  @click="addQrDialog = !addQrDialog"
                />
              </v-list>
            </v-menu>
          </v-row>
        </page-title>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-sheet class="pa-4">
          <h3>QR Codes</h3>
          <v-data-table-server
            v-model:items-per-page="itemsPerPage"
            :headers="headers"
            :items="qrCodes"
            :items-length="totalCount"
            :loading="loading"
            disable-sort
            @click:row="openViewQrDialog"
            @update:options="loadItems"
          >
            <template #item.createdAt="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>
          </v-data-table-server>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>

  <v-dialog v-model="addQrDialog" :width="450">
    <v-card class="pa-5">
      <v-form
        ref="addQrForm"
        v-model="isFormValid"
        fast-fail
        @submit.prevent="handleSubmitAddQrCode"
      >
        <v-card-title class="text-center">
          <h2>Add QR Code</h2>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newQrCode.title"
            :rules="[(v) => !!v || 'Title is required!']"
            class="mt-2"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Title"
            rounded="lg"
            variant="outlined"
          />
          <v-text-field
            v-model="newQrCode.qrCode"
            :rules="[(v) => !!v || 'QR code required!']"
            class="mt-2"
            clearable
            density="comfortable"
            hide-details="auto"
            label="QR code"
            rounded="lg"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            :density="xs ? 'comfortable' : 'default'"
            class="mx-auto mt-2 mt-md-4"
            color="primary"
            rounded="lg"
            size="large"
            type="submit"
            variant="elevated"
          >
            Add
          </v-btn>
          <v-btn
            :density="xs ? 'comfortable' : 'default'"
            class="mx-auto mt-2 mt-md-4"
            color="secondary"
            rounded="lg"
            size="large"
            variant="elevated"
            @click="addQrDialog = !addQrDialog"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>

  <v-dialog v-model="viewQrDialog" :width="450">
    <v-card class="pa-5">
      <v-card-title class="text-center">
        <h2>View QR Code</h2>
        <h4>{{ selectedQrCode.title }}</h4>
      </v-card-title>
      <v-card-text>
        <v-row align="center" justify="center">
          <v-col cols="auto">
            <QRCodeVue3
              :corners-square-options="qrOptions"
              :dots-options="qrOptions"
              :download="true"
              :height="250"
              :margin="10"
              :value="selectedQrCode.qrCode"
              :width="250"
              download-button="v-btn v-btn--block bg-primary v-btn--density-default v-btn--variant-flat mt-2 pa-2"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          :density="xs ? 'comfortable' : 'default'"
          class="mx-auto mt-2 mt-md-4"
          color="primary"
          rounded="lg"
          size="large"
          variant="elevated"
          @click="viewQrDialog = !viewQrDialog"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
