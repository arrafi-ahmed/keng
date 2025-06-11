<script setup>
const { title, value, icon, iconSize } = defineProps([
  "title",
  "value",
  "icon",
  "iconSize",
]);
</script>

<template>
  <v-sheet class="pa-3" rounded="lg">
    <div class="text-disabled">
      <h5 class="font-weight-medium">{{ title }}</h5>
    </div>
    <div class="d-flex justify-space-between align-center">
      <h2>{{ value || "-" }}</h2>
      <v-icon :size="iconSize">{{ icon }}</v-icon>
    </div>
  </v-sheet>
</template>

<style scoped></style>
