<script setup>
import ProgressLoader from "@/components/ProgressLoader.vue";
import { watch } from "vue";
import { useRoute } from "vue-router";
import { appInfo } from "@/others/util";
import { useStore } from "vuex";

const route = useRoute();
const store = useStore();

const snackbars = computed(() => store.state.snackbars);

// Handle Vuetify's update
const setSnackbars = (val) => {
  store.commit("setSnackbars", val);
};

watch(route, (to) => {
  document.title =
    (to.meta.title && to.meta.title + " | " + appInfo.name) || appInfo.name;
});
</script>
<template>
  <v-app>
    <v-main class="bg-tertiary">
      <progress-loader />
      <v-snackbar-queue
        :model-value="snackbars"
        :timeout="4000"
        closable
        location="bottom start"
        timer
        @update:model-value="setSnackbars"
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

.text-truncate-multi-line {
  display: -webkit-box;
  -webkit-line-clamp: 3; /* Still needed for broad current support */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;

  /* For future compatibility when line-clamp is widely adopted */
  /* Note: This might require specific display properties in the future */
  /* display: block; */ /* Or whatever is needed for the new line-clamp spec */
  /* line-clamp: 2; */ /* The future standard, currently limited support */
}

.v-carousel {
  height: inherit !important;
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
