<script setup>
import { useRoute } from "vue-router";
import { computed, ref } from "vue";
import { useStore } from "vuex";

definePage({
  name: "not-found",
  meta: {
    title: "Not Found",
    layout: "headerless",
  },
});

const route = useRoute();
const store = useStore();
const status = ref(route.query.status || 404);
const message = ref(route.query.message || "Looks like you're lost!");

const calcHome = computed(() => store.getters["user/calcHome"]);
</script>

<template>
  <v-container class="fill-height">
    <v-row
      align="center"
      justify="center"
    >
      <v-col
        :cols="10"
        class="bg page_404 text-center"
      >
        <h1>{{ status }}</h1>
        <div>{{ message }}</div>
        <v-btn
          :to="calcHome"
          class="clickable"
          color="primary"
          size="small"
          variant="text"
        >
          Go Home
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.bg {
  background-image: url(https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif);
  height: 450px;
  background-position: center;
}
</style>
