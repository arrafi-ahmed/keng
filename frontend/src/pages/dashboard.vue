<script setup>
import { useRouter } from "vue-router";
import { useStore } from "vuex";

const store = useStore();
const router = useRouter();

definePage({
  name: "dashboard",
  meta: {
    requiresAuth: true,
    layout: "default",
  },
});

// Redirect logic
if (store.getters["user/calcHome"]) {
  router.replace(store.getters["user/calcHome"]);
}
</script>

<template>
  <!-- Empty Template as we're just handling the redirect -->
</template>
