<script setup>
import { getApiPublicFileUrl } from "@/others/util.js";

const uploading = defineModel("uploading");
const toRemove = defineModel("toRemove");

defineProps({
  title: { type: String, default: "" },
  uploaded: { type: Array, default: () => [] },
  filePrefix: { type: String, default: "" },
  variant: { type: String, default: "image" },
});
</script>
<template>
  <v-card class="mt-2 mt-md-4">
    <v-card-title>{{ title }}</v-card-title>
    <v-card-text>
      <v-file-upload
        v-model="uploading"
        class="mt-2 mb-2"
        clearable
        density="compact"
        multiple
        title="Upload"
        variant="compact"
      />
      <v-list v-if="uploaded?.length > 0">
        <v-list-item
          v-for="(file, index) in uploaded"
          :key="index"
          :disabled="toRemove.includes(file)"
          border
          rounded
          variant="text"
          lines="two"
        >
          <v-list-item-title>
            {{ file.filename }}
          </v-list-item-title>
          <v-list-item-subtitle
            v-if="toRemove.includes(file)"
            class="text-red"
          >
            Pending deletion
          </v-list-item-subtitle>
          <v-list-item-subtitle
            v-else
            class="text-green"
          >
            Uploaded
          </v-list-item-subtitle>
          <template #prepend>
            <v-avatar
              v-if="variant === 'image'"
              :image="getApiPublicFileUrl(file.filename, filePrefix)"
              tile
              rounded
            />
            <v-avatar
              v-else-if="variant === 'file'"
              icon="mdi-file-outline"
              tile
              rounded
            />
          </template>
          <template #append>
            <v-btn
              variant="text"
              density="comfortable"
              icon="mdi-close-circle"
              @click="toRemove.push(file)"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>
