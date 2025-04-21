<script setup>
import { getUserImageUrl } from "@/others/util";

const { imgSrc, clickable } = defineProps({
  imgSrc: {},
  clickable: { default: true },
});
</script>

<template>
  <v-avatar
    :class="{ clickable }"
    :size="35"
    rounded
    title
    @click="clickable ? $emit('clickAvatar') : undefined"
  >
    <v-img
      :aspect-ratio="1"
      :src="getUserImageUrl(imgSrc)"
      alt="User Avatar"
      cover
    />
  </v-avatar>
</template>

<style scoped></style>
