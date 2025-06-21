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

<template></template>

<style scoped></style>
