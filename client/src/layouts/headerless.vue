<script setup>
import DefaultFooter from "@/layouts/parts/footer.vue";
</script>

<template>
  <v-app>
    <v-main>
      <div class="fill-height limit-max-width-xl mx-auto">
        <router-view />
      </div>
    </v-main>
    <default-footer />
  </v-app>
</template>

<style></style>
