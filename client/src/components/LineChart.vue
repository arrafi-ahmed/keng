<script setup>
import { defineProps } from "vue";
import { Line } from "vue-chartjs";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
);

// Props to pass data and options
defineProps({
  chartData: { type: Object },
  chartOptions: { type: Object },
  height: { type: Number },
});
</script>

<template>
  <Line :data="chartData" :height="height" :options="chartOptions" />
</template>
