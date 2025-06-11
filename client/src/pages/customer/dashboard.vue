<script setup>
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import PageTitle from "@/components/PageTitle.vue";
import DashboardCard from "@/components/DashboardCard.vue";

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
    title: "Product Name",
    align: "start",
    key: "productName",
  },
  {
    title: "Purchase Date",
    align: "start",
    key: "purchasedPrice",
  },
  {
    title: "Purchase Date",
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
        <page-title title="Welcome to Dashboard" border-b></page-title>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <dashboard-card
          title="TOTAL PURCHASE"
          :value="stats?.totalPurchase"
          icon="mdi-cash"
          :iconSize="30"
        ></dashboard-card>
      </v-col>
      <v-col>
        <dashboard-card
          title="ACTIVE WARRANTIES"
          :value="stats?.activeWarranties"
          icon="mdi-shield"
          :iconSize="30"
        ></dashboard-card>
      </v-col>
      <v-col>
        <dashboard-card
          title="QR CODES CREATED"
          :value="stats?.totalQr"
          icon="mdi-qrcode"
          :iconSize="30"
        ></dashboard-card>
      </v-col>
      <v-col>
        <dashboard-card
          title="TOTAL SCANS"
          :value="stats?.totalScans"
          icon="mdi-select-all"
          :iconSize="30"
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
            :loading="loading"
            :items="recentPurchases"
            :items-length="totalCount"
            disable-sort
            @update:options="loadItems"
          ></v-data-table-server>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>
