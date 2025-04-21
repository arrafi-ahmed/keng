<script setup>
import { appInfo } from "@/others/util";
import { computed } from "vue";
import { useStore } from "vuex";

const store = useStore();

const calcHome = computed(() => store.getters["user/calcHome"]);
const items = [{ title: "Home", to: calcHome }];
</script>
<template>
  <v-footer class="bg-grey-lighten-3 flex-grow-0">
    <v-row justify="center" no-gutters>
      <!--      <v-btn-->
      <!--        v-for="(item, index) in items"-->
      <!--        :key="index"-->
      <!--        :to="getToLink(item)"-->
      <!--        class="mx-md-2"-->
      <!--        color="primary"-->
      <!--        exact-->
      <!--        rounded-->
      <!--        size="small"-->
      <!--        variant="text"-->
      <!--      >-->
      <!--        {{ item.title }}-->
      <!--      </v-btn>-->
      <v-col :cols="12" class="text-center">
        <small>
          &copy; {{ new Date().getFullYear() }} —
          <strong>{{ appInfo.name }}</strong> v{{ appInfo.version }}
        </small>
      </v-col>
    </v-row>
  </v-footer>
</template>
