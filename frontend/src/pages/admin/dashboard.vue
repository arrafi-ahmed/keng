<script setup>
import {useStore} from "vuex";
import {useRouter} from "vue-router";
import PageTitle from "@/components/PageTitle.vue";
import BarChart from "@/components/BarChart.vue";
import NoItems from "@/components/NoItems.vue";
import LineChart from "@/components/LineChart.vue";
import DashboardCard from "@/components/DashboardCard.vue";
import {
  getBarChartOptions,
  getCommonDatasetProps,
  getLineChartOptions,
} from "@/others/chartConfig.js";
import {useTheme} from "vuetify/framework";
import {useDisplay} from "vuetify";

definePage({
  name: "admin-dashboard",
  meta: {
    layout: "default",
    title: "Dashboard",
  },
});
const store = useStore();
const router = useRouter();
const {xs} = useDisplay();

const totalScanCount = computed(() => store.state.scanAnalytics.totalScanCount);
const monthlyScanCount = computed(
  () => store.state.scanAnalytics.monthlyScanCount,
);
const dailyScanCount = computed(() => store.state.scanAnalytics.dailyScanCount);
const scanByLocationCount = computed(
  () => store.state.scanAnalytics.scanByLocation,
);
const scanByCountryCount = computed(() =>
  scanByLocationCount.value.filter((item) => item.isCountryTotal === 1),
);
const scanByCityCount = computed(() =>
  scanByLocationCount.value.filter((item) => item.isCountryTotal === 0),
);
router.push(store.getters["user/calcHome"]);

const types = ref([
  {title: "Total", value: 0},
  {title: "Model", value: 1},
  {title: "Unit", value: 2},
]);
const selectedTypeIndex = ref(null);

const monthlyScanChart = ref(null);
const dailyScanChart = ref(null);
const scanByCountryChart = ref(null);
const scanByCityChart = ref(null);

const commonDatasetProps = getCommonDatasetProps();

const monthlyScanChartSrc = computed(() => {
  // Check if rawMonthlyScans.value is available and is an array
  if (!monthlyScanCount.value || !Array.isArray(monthlyScanCount.value)) {
    return {labels: [], datasets: []}; // Return empty data if not ready
  }

  // Directly map the data returned by the backend
  const chartLabels = monthlyScanCount.value.map((item) => item.scanMonth);
  const modelData = monthlyScanCount.value.map((item) => parseInt(item.model));
  const unitData = monthlyScanCount.value.map((item) => parseInt(item.unit));
  const totalData = monthlyScanCount.value.map((item) => parseInt(item.total));

  return {
    labels: chartLabels,
    datasets: [
      {
        label: "Total Scans",
        backgroundColor: "#bb66b0",
        borderColor: "#bb66b0",
        data: totalData,
        ...commonDatasetProps,
      },
      {
        label: "Model Scans",
        backgroundColor: "#42A5F5",
        borderColor: "#42A5F5",
        data: modelData,
        ...commonDatasetProps,
      },
      {
        label: "Unit Scans",
        backgroundColor: "#66BB6A",
        borderColor: "#66BB6A",
        data: unitData,
        ...commonDatasetProps,
      },
    ],
  };
});

const dailyScanChartSrc = computed(() => {
  // Check if rawMonthlyScans.value is available and is an array
  if (!dailyScanCount.value || !Array.isArray(dailyScanCount.value)) {
    return {labels: [], datasets: []}; // Return empty data if not ready
  }

  // Directly map the data returned by the backend
  const chartLabels = dailyScanCount.value.map((item) => item.scanHour);
  const modelData = dailyScanCount.value.map((item) => parseInt(item.model));
  const unitData = dailyScanCount.value.map((item) => parseInt(item.unit));
  const totalData = dailyScanCount.value.map((item) => parseInt(item.total));

  return {
    labels: chartLabels,
    datasets: [
      {
        label: "Total Scans",
        backgroundColor: "#bb66b0",
        borderColor: "#bb66b0",
        data: totalData,
        ...commonDatasetProps,
      },
      {
        label: "Model Scans",
        backgroundColor: "#42A5F5",
        borderColor: "#42A5F5",
        data: modelData,
        ...commonDatasetProps,
      },
      {
        label: "Unit Scans",
        backgroundColor: "#66BB6A",
        borderColor: "#66BB6A",
        data: unitData,
        ...commonDatasetProps,
      },
    ],
  };
});

const scanByCountrySrc = computed(() => {
  // Check if rawMonthlyScans.value is available and is an array
  if (!scanByCountryCount.value || !Array.isArray(scanByCountryCount.value)) {
    return {labels: [], datasets: []}; // Return empty data if not ready
  }

  // Directly map the data returned by the backend
  const chartLabels = scanByCountryCount.value.map((item) => item.country);
  const modelData = scanByCountryCount.value.map((item) =>
    parseInt(item.model),
  );
  const unitData = scanByCountryCount.value.map((item) => parseInt(item.unit));
  const totalData = scanByCountryCount.value.map((item) =>
    parseInt(item.total),
  );

  return {
    labels: chartLabels,
    datasets: [
      {
        label: "Total Scans",
        backgroundColor: "#bb66b0",
        borderColor: "#bb66b0",
        data: totalData,
        ...commonDatasetProps,
      },
      {
        label: "Model Scans",
        backgroundColor: "#42A5F5",
        borderColor: "#42A5F5",
        data: modelData,
        ...commonDatasetProps,
      },
      {
        label: "Unit Scans",
        backgroundColor: "#66BB6A",
        borderColor: "#66BB6A",
        data: unitData,
        ...commonDatasetProps,
      },
    ],
  };
});

const scanByCitySrc = computed(() => {
  // Check if rawMonthlyScans.value is available and is an array
  if (!scanByCityCount.value || !Array.isArray(scanByCityCount.value)) {
    return {labels: [], datasets: []}; // Return empty data if not ready
  }

  // Directly map the data returned by the backend
  const chartLabels = scanByCityCount.value.map((item) => item.city);
  const modelData = scanByCityCount.value.map((item) => parseInt(item.model));
  const unitData = scanByCityCount.value.map((item) => parseInt(item.unit));
  const totalData = scanByCityCount.value.map((item) => parseInt(item.total));

  return {
    labels: chartLabels,
    datasets: [
      {
        label: "Total Scans",
        backgroundColor: "#bb66b0",
        borderColor: "#bb66b0",
        data: totalData,
        ...commonDatasetProps,
      },
      {
        label: "Model Scans",
        backgroundColor: "#42A5F5",
        borderColor: "#42A5F5",
        data: modelData,
        ...commonDatasetProps,
      },
      {
        label: "Unit Scans",
        backgroundColor: "#66BB6A",
        borderColor: "#66BB6A",
        data: unitData,
        ...commonDatasetProps,
      },
    ],
  };
});
const theme = useTheme();
const barChartOptions = computed(() =>
  getBarChartOptions(theme.current.value.colors),
);
const lineChartOptions = computed(() => {
  return getLineChartOptions(theme.current.value.colors);
});

watch(
  () => selectedTypeIndex.value,
  (newVal, oldVal) => {
    monthlyScanChart.value = {
      ...monthlyScanChartSrc.value,
      datasets: [monthlyScanChartSrc.value?.datasets?.[newVal]],
    };
    dailyScanChart.value = {
      ...dailyScanChartSrc.value,
      datasets: [dailyScanChartSrc.value?.datasets?.[newVal]],
    };
    scanByCountryChart.value = {
      ...scanByCountrySrc.value,
      datasets: [scanByCountrySrc.value?.datasets?.[newVal]],
    };
    scanByCityChart.value = {
      ...scanByCitySrc.value,
      datasets: [scanByCitySrc.value?.datasets?.[newVal]],
    };
  },
);

const fetchData = async () => {
  await store.dispatch("scanAnalytics/setScanAnalytics");
};
onMounted(async () => {
  await fetchData();
  selectedTypeIndex.value = 0;
});
</script>

<template>
  <v-container>
    <v-row>
      <v-col>
        <page-title
          :title-col="{cols:7, sm:9, md:9, lg:9, xl:9}"
          border-b
          title="Welcome to Dashboard"
        >
          <v-row
            align="center"
          >
            <v-col cols="12">
              <v-select
                v-model="selectedTypeIndex"
                :items="types"
                class="mb-2"
                :max-width="xs ? 105 : 150"
                density="compact"
                hide-details
                items-title="title"
                items-value="value"
                rounded
                variant="solo-filled"
              />
            </v-col>
          </v-row>
        </page-title>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <dashboard-card
          :icon-size="40"
          :value="totalScanCount?.total"
          icon="mdi-cube-outline"
          title="TOTAL SCANS"
        />
      </v-col>
      <v-col>
        <dashboard-card
          :icon-size="40"
          :value="totalScanCount?.model"
          icon="mdi-tag"
          title="MODEL SCANS"
        />
      </v-col>
      <v-col>
        <dashboard-card
          :icon-size="40"
          :value="totalScanCount?.unit"
          icon="mdi-select-all"
          title="UNIT SCANS"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col :cols="12">
        <v-sheet
          class="pa-3"
          rounded="lg"
        >
          <div class="d-flex justify-space-between align-center mb-2 mb-md-4">
            <div>
              <h3 class="font-weight-medium">
                Scans Over Time
              </h3>
            </div>
          </div>
          <line-chart
            v-if="monthlyScanChart?.datasets?.[0]?.data?.length"
            :chart-data="monthlyScanChart"
            :chart-options="lineChartOptions"
            :height="80"
          />
          <no-items v-else />
        </v-sheet>
      </v-col>
    </v-row>

    <v-row>
      <v-col :cols="12">
        <v-sheet
          class="pa-3"
          rounded="lg"
        >
          <div class="d-flex justify-space-between align-center mb-2 mb-md-4">
            <div>
              <h3 class="font-weight-medium">
                Daily Scan Count
              </h3>
            </div>
          </div>
          <bar-chart
            v-if="dailyScanChart?.datasets?.[0]?.data?.length"
            :chart-data="dailyScanChart"
            :chart-options="barChartOptions"
            :height="80"
          />
          <no-items v-else />
        </v-sheet>
      </v-col>
    </v-row>

    <v-row>
      <v-col :cols="12">
        <v-sheet
          class="pa-3"
          rounded="lg"
        >
          <div class="d-flex justify-space-between align-center mb-2 mb-md-4">
            <div>
              <h3 class="font-weight-medium">
                Scan By City
              </h3>
            </div>
          </div>
          <bar-chart
            v-if="scanByCityChart?.datasets?.[0]?.data?.length"
            :chart-data="scanByCityChart"
            :chart-options="barChartOptions"
            :height="80"
          />
          <no-items v-else />
        </v-sheet>
      </v-col>
    </v-row>

    <v-row>
      <v-col :cols="12">
        <v-sheet
          class="pa-3"
          rounded="lg"
        >
          <div class="d-flex justify-space-between align-center mb-2 mb-md-4">
            <div>
              <h3 class="font-weight-medium">
                Scan By Country
              </h3>
            </div>
          </div>
          <bar-chart
            v-if="scanByCountryChart?.datasets?.[0]?.data?.length"
            :chart-data="scanByCountryChart"
            :chart-options="barChartOptions"
            :height="80"
          />
          <no-items v-else />
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>
