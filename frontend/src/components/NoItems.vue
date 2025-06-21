<script setup>
const { justify, text, variant, cols, sm, md, lg, xl, closable, customClass } =
  defineProps({
    justify: { type: String, default: "center" },
    text: { type: String, default: "No items found!" },
    variant: { type: String, default: "tonal" },
    cols: { type: Number, default: 12 },
    sm: { type: Number },
    md: { type: Number },
    lg: { type: Number },
    xl: { type: Number },
    closable: { type: Boolean, default: true },
    customClass: { type: String, default: "text-center" },
  });
</script>

<template>
  <v-container>
    <v-row :class="`${customClass} text-wrap`" :justify="justify">
      <v-col :cols="cols" :lg="lg" :md="md" :sm="sm" :xl="xl">
        <v-alert
          :closable="closable"
          :text="text"
          :variant="variant"
          density="compact"
          icon="mdi-information-outline"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>
