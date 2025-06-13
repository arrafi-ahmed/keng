<script setup>
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import PageTitle from "@/components/PageTitle.vue";
import DashboardCard from "@/components/DashboardCard.vue";
import { defaultCurrency, formatDate, formatDateTime } from "@/others/util.js";

definePage({
  name: "customer-dashboard",
  meta: {
    layout: "default",
    title: "Dashboard",
  },
});
const store = useStore();
const router = useRouter();

const stats = computed(() => store.state.customerInsights.stats);
const recentPurchases = computed(
  () => store.state.customerInsights.recentPurchases,
);

const itemsPerPage = ref(10);
const totalCount = ref(0);
const loading = ref(false);
const headers = ref([
  {
    title: "Name",
    align: "start",
    key: "productName",
  },
  {
    title: "Serial",
    align: "start",
    key: "identityNo",
  },
  {
    title: "Price",
    align: "start",
    key: "purchasedPrice",
  },
  {
    title: "Purchase Time",
    align: "start",
    key: "purchaseDate",
  },
  {
    title: "Warranty Status",
    align: "start",
    key: "warrantyStatus",
  },
]);

const loadItems = ({ page, itemsPerPage }) => {
  loading.value = true;
  return store
    .dispatch("customerInsights/setRecentPurchases", {
      page,
      itemsPerPage,
      fetchTotalCount: !recentPurchases.value?.items,
    })
    .then(({ total }) => {
      totalCount.value = total;
    })
    .finally(() => {
      loading.value = false;
    });
};

const onRowClick = (event, { item }) => {
  router.push({
    name: "product-identity-single-landing",
    params: {
      productId: item.productId,
      productIdentitiesId: item.productIdentitiesId,
    },
    query: {
      uuid: item.uuid,
    },
  });
};

const fetchData = async () => {
  await Promise.allSettled([store.dispatch("customerInsights/setStats")]);
};
onMounted(async () => {
  await fetchData();
});
</script>

<template>
  <v-container>
    <v-row>
      <v-col>
        <page-title border-b title="Welcome to Dashboard"></page-title>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <dashboard-card
          :iconSize="30"
          :value="`${defaultCurrency.symbol}${stats?.totalPurchase}`"
          icon="mdi-cash"
          title="TOTAL PURCHASE"
        ></dashboard-card>
      </v-col>
      <v-col>
        <dashboard-card
          :iconSize="30"
          :value="stats?.activeWarranties"
          icon="mdi-shield"
          title="ACTIVE WARRANTIES"
        ></dashboard-card>
      </v-col>
      <v-col>
        <dashboard-card
          :iconSize="30"
          :value="stats?.totalQr"
          icon="mdi-qrcode"
          title="QR CODES CREATED"
        ></dashboard-card>
      </v-col>
      <v-col>
        <dashboard-card
          :iconSize="30"
          :value="stats?.totalScans"
          icon="mdi-select-all"
          title="TOTAL SCANS"
        ></dashboard-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-sheet class="pa-4">
          <h3>Recent Purchases</h3>
          <v-data-table-server
            v-model:items-per-page="itemsPerPage"
            :headers="headers"
            :items="recentPurchases"
            :items-length="totalCount"
            :loading="loading"
            disable-sort
            @click:row="onRowClick"
            @update:options="loadItems"
          >
            <template #item.purchaseDate="{ item }">
              {{ formatDateTime(item.purchaseDate) }}
            </template>
            <template #item.purchasedPrice="{ item }">
              {{defaultCurrency.symbol}}{{ item.purchasedPrice }}
            </template>
            <template #item.warrantyStatus="{ item }">
              <div v-if="item.warrantyStatus === 0" class="text-error">
                Expired
              </div>
              <div v-else-if="item.warrantyStatus === 1" class="text-success">
                Active
              </div>
              <div v-else>
                Not Available
              </div>
            </template>
          </v-data-table-server>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>
