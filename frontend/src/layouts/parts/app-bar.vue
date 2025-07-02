<script setup>
import Logo from "@/components/Logo.vue";
import {useRouter} from "vue-router";
import {useStore} from "vuex";
import {computed, ref} from "vue";
import {getClientPublicImageUrl, getToLink} from "@/others/util";
import UserAvatar from "@/components/UserAvatar.vue";
import {useDisplay} from "vuetify";

const store = useStore();
const router = useRouter();
const {smAndUp} = useDisplay();

const signedin = computed(() => store.getters["user/signedin"]);
const currentUser = computed(() => store.getters["user/getCurrentUser"]);
const calcHome = computed(() => store.getters["user/calcHome"]);

const isAdmin = computed(() => store.getters["user/isAdmin"]);
const isCustomer = computed(() => store.getters["user/isCustomer"]);

const menuItemsAdmin = [
  {title: "Products", to: {name: "products"}},
  {
    title: "Import/Export",
    to: {
      name: "importExport",
    },
  },
];

const menuItemsCustomer = [
  {title: "QR Codes", to: {name: "qr-code-listing"}},
  {
    title: "Warranty Status",
    to: {
      name: "warranty-status",
    },
  },
];
const isRequiresNoAuth = computed(() =>
  store.state.routeInfo.to.matched.some((record) => record.meta.requiresNoAuth),
);

const menuItems = computed(() => {
  let items = [{title: "Home", to: calcHome.value}];
  if (isAdmin.value) {
    items = items.concat(menuItemsAdmin);
  }
  if (isCustomer.value) {
    items = items.concat(menuItemsCustomer);
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
    :height="80"
    :order="1"
    class="px-2 px-md-5"
    color="header"
    flat
  >
    <logo
      :img-class="isRequiresNoAuth ? 'mx-auto' : 'mx-3'"
      :img-src="getClientPublicImageUrl('logo.png')"
      :title="false"
      :width="smAndUp ? 190: 150"
      container-class="clickable"
      @click="router.push(calcHome)"
    />

    <template #append>
      <v-btn
        v-if="signedin"
        rounded="pill"
        :size="smAndUp ? 'large' : 'default'"
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
        <template
          v-if="smAndUp"
          #default
        >
          <span
            class="text-capitalize"
            style="font-size: 0.8rem"
          >{{
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
  >
    <v-list
      density="compact"
      nav
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
          color="primary"
          prepend-icon="mdi-exit-to-app"
        >
          Signout
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<style scoped></style>
