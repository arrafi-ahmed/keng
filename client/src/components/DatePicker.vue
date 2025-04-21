<script setup>
import { defineProps, onMounted, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import { formatDate } from "@/others/util";

const model = defineModel();
const { width, height, xs } = useDisplay();

const { label, color, customClass, rules, variant, density, showIcon } =
  defineProps([
    "label",
    "color",
    "customClass",
    "rules",
    "variant",
    "density",
    "showIcon",
  ]);
const menu = ref(false);
const formattedDate = ref(formatDate(model.value));

const handleDateChange = (newDate) => {
  model.value = newDate;
};
watch(
  () => model.value,
  (newVal) => {
    formattedDate.value = formatDate(newVal);
    menu.value = false;
  },
);
onMounted(() => {
  model.value = model.value ? new Date(model.value) : null;
});
</script>

<template v-if="formattedDate">
  <v-menu v-model="menu" :close-on-content-click="false" location="center">
    <template #activator="{ props }">
      <v-text-field
        v-model="formattedDate"
        :class="customClass"
        :density="density"
        :label="label"
        :prepend-inner-icon="showIcon ? 'mdi-calendar' : null"
        :rules="rules"
        :variant="variant"
        hide-details="auto"
        readonly
        v-bind="props"
        @click:clear="formattedDate = null"
      />
    </template>
    <div class="position-relative">
      <v-date-picker
        v-model="model"
        :color="color"
        :width="xs ? width - 30 : 'auto'"
        height="auto"
        show-adjacent-months
        title=""
        @update:model-value="handleDateChange"
      />
      <v-btn
        class="position-absolute top-0 right-0"
        color="white"
        icon="mdi-close"
        size="small"
        variant="text"
        @click="menu = false"
      />
    </div>
  </v-menu>
</template>
<style>
.v-overlay__content:has(> .v-date-picker) {
  min-width: auto !important;
}

.v-picker-title {
  padding: 0 !important;
}

@media only screen and (max-width: 600px) {
  .v-overlay__content:has(> .v-date-picker) {
    left: 0 !important;
  }
}
</style>
