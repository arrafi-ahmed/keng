<script setup>
import { useStore } from "vuex";
import { useRouter } from "vue-router";

definePage({
  name: "home",
  meta: {
    layout: "default",
  },
});
const store = useStore();
const router = useRouter();

router.push(store.getters["user/calcHome"]);
</script>

<template>
  <h2 class="d-flex justify-center align-center">
    Welcome home from QuickStarter Client
  </h2>
</template>

<style scoped></style>
