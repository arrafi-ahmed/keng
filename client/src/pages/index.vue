<script setup>
import { useStore } from "vuex";
import { useRouter } from "vue-router";

definePage({
  name: "home",
  meta: {
    layout: "default",
    title: "Dashboard",
  },
});
const store = useStore();
const router = useRouter();

router.push(store.getters["user/calcHome"]);
</script>

<template>
  <div class="d-flex justify-center align-center text-center pa-5">
    <h2 class="w-75">
      Welcome Dashboard
    </h2>
  </div>
</template>

<style scoped></style>
