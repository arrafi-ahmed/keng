<script setup>
import { ref } from "vue";

const model = defineModel();

const { label, customClass, density, rules, variant, showIcon } = defineProps([
  "label",
  "customClass",
  "density",
  "rules",
  "variant",
  "showIcon",
]);
const menu = ref(false);

const handleTimeUnitChange = (newVal, unitType) => {
  // Parse the model value into a Date object
  if (!model.value) {
    if (unitType === "min") menu.value = false;
    return newVal;
  }

  const modelValueParts = model.value.split(":");
  const oldTime = new Date();
  oldTime.setHours(modelValueParts[0], modelValueParts[1]);

  // Update the val
  if (unitType === "min") oldTime.setMinutes(newVal);
  if (unitType === "hr") oldTime.setHours(newVal);

  model.value = oldTime.toTimeString().slice(0, 5);
  if (unitType === "min") menu.value = false;
};
</script>

<template>
  <v-row justify="space-around">
    <v-col>
      <v-text-field
        v-model="model"
        :active="menu"
        :class="customClass"
        :density="density"
        :focus="menu"
        :label="label"
        :prepend-inner-icon="showIcon ? 'mdi-clock-time-four-outline' : null"
        :rules="rules"
        :variant="variant"
        hide-details="auto"
        readonly
      >
        <v-menu
          v-model="menu"
          :close-on-content-click="false"
          activator="parent"
          transition="scale-transition"
          @keyup.enter=""
        >
          <v-time-picker
            v-if="menu"
            v-model="model"
            format="24hr"
            full-width
            scrollable
            @update:minute="handleTimeUnitChange($event, 'min')"
            @update:hour="handleTimeUnitChange($event, 'hr')"
          />
        </v-menu>
      </v-text-field>
    </v-col>
  </v-row>
</template>

<style scoped></style>
