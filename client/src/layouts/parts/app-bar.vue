<script setup>
import Logo from "@/components/Logo.vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { computed, ref } from "vue";
import { getClientPublicImageUrl, getToLink } from "@/others/util";
import UserAvatar from "@/components/UserAvatar.vue";

const store = useStore();
const router = useRouter();

const signedin = computed(() => store.getters["user/signedin"]);
const currentUser = computed(() => store.getters["user/getCurrentUser"]);
const calcHome = computed(() => store.getters["user/calcHome"]);

const isSudo = computed(() => store.getters["user/isSudo"]);

const menuItemsSudo = [{ title: "Products", to: { name: "products" } }];

const menuItems = computed(() => {
  let items = [{ title: "Home", to: calcHome.value }];
  if (isSudo.value) {
    items = items.concat(menuItemsSudo);
  }
  return items;
});

const drawer = ref(false);

const getFirstName = computed(() => currentUser.value.name?.split(" ")[0]);
const getGreetings = computed(() => {
  const hour = new Date().getHours();
  return `Good ${hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}!`;
});
</script>

<template>
  <v-app-bar
    :order="1"
    class="px-2 px-md-5"
    dense
    density="compact"
    flat
    color="background"
  >
    <logo
      :img-src="getClientPublicImageUrl('logo.png')"
      :title="true"
      :width="30"
      container-class="clickable"
      img-class="mx-auto"
      @click="router.push(calcHome)"
    />

    <template #append>
      <v-btn
        v-if="signedin"
        rounded="pill"
        variant="elevated"
        @click="drawer = !drawer"
      >
        <template #prepend>
          <v-avatar :size="25">
            <v-icon :size="25">
              mdi-account-circle
            </v-icon>
          </v-avatar>
        </template>
        <template #default>
          <span class="text-body-2 text-capitalize">{{
            currentUser.name ? currentUser.name.split(" ")[0] : ""
          }}</span>
        </template>
        <template #append>
          <v-icon :icon="drawer ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
        </template>
      </v-btn>
    </template>
  </v-app-bar>
  <v-navigation-drawer
    v-if="signedin"
    v-model="drawer"
    :width="220"
    location="end"
    temporary
    color="primary"
  >
    <v-list
      nav
      density="compact"
    >
      <v-list-item>
        <div class="d-flex justify-start align-center">
          <user-avatar
            :img-src="currentUser.image"
            @click-avatar="drawer = !drawer"
          />
          <div class="ml-3">
            <small>
              {{ getGreetings }}
            </small>
            <div>
              {{ getFirstName }}
            </div>
          </div>
        </div>
      </v-list-item>
      <v-divider class="mt-2 mb-2" />
      <v-list-item
        v-for="(item, index) in menuItems"
        :key="index"
        :to="getToLink(item)"
      >
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
    <template #append>
      <div class="ma-5">
        <v-btn
          :to="{ name: 'signout' }"
          block
          color="secondary"
          prepend-icon="mdi-exit-to-app"
        >
          Signout
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<style scoped></style>
