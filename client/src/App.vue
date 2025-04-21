<script setup>
import { Toaster } from "vue-sonner";
import ProgressLoader from "@/components/ProgressLoader.vue";
import { watch } from "vue";
import { useRoute } from "vue-router";
import { appInfo } from "@/others/util";

const route = useRoute();

watch(route, (to) => {
  document.title =
    (to.meta.title && to.meta.title + " | " + appInfo.name) || appInfo.name;
});
</script>
<template>
  <v-app>
    <v-main>
      <progress-loader />
      <Toaster
        :expand="true"
        class="custom-toast"
        close-button
        position="bottom-left"
        rich-colors
        theme="dark"
      />
      <router-view />
    </v-main>
  </v-app>
</template>
<style>
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@100;300;400;500;700;900&display=swap");

.v-application {
  font-family: "Poppins", sans-serif;
}

body,
.custom-toast {
  font-family: "Poppins", sans-serif !important;
}

.clickable {
  cursor: pointer;
}

.v-chip-0-padding {
  padding: 0 !important;
}

.flex-sticky {
  position: sticky;
  align-self: flex-start;
  z-index: 999;
}

.div-sticky {
  position: sticky;
  height: auto;
  z-index: 999;
}

.top-60 {
  top: 60px;
}

.z-index-max {
  z-index: 999999 !important;
}

.text-overline {
  line-height: 1.5;
}

.max-content {
  min-width: max-content;
}

.scrollable-container {
  overflow-x: auto; /* Allows horizontal scrolling */
  white-space: nowrap; /* Prevents wrapping of child elements */
}

.scrollable-container .v-row {
  flex-wrap: nowrap; /* Prevents row from wrapping */
  /* width: max-content; /* Ensures the row expands based on its content */
}
</style>
