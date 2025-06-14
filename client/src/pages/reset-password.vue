<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { getQueryParam, isValidPass } from "@/others/util";
import PageTitle from "@/components/PageTitle.vue";
import { useDisplay } from "vuetify";

definePage({
  name: "submit-reset-password", // Set the route name to 'signin'
  meta: {
    layout: "default",
    title: "Reset Password",
    requiresNoAuth: true,
  },
});

const { mobile } = useDisplay();
const store = useStore();
const router = useRouter();

const password = ref(null);
const confirmPassword = ref(null);

const form = ref(null);
const isFormValid = ref(true);

const handleSubmitResetPassword = async () => {
  await form.value.validate();
  if (!isFormValid.value) return;

  store
    .dispatch("user/submitResetPass", {
      newPass: password.value,
      token: getQueryParam({ param: "token" }),
    })
    .then((res) => {
      router.push({
        name: "signin",
      });
    })
    .catch((err) => {});
};
</script>

<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" md="5">
        <page-title justify="center" title="Reset Password" title-col="auto" />
        <v-card
          class="mx-auto pa-2 pa-md-5 my-2 my-md-5"
          elevation="4"
          max-width="600"
        >
          <v-card-text>
            <v-form
              ref="form"
              v-model="isFormValid"
              fast-fail
              @submit.prevent="handleSubmitResetPassword"
            >
              <!-- Password -->
              <v-text-field
                v-model="password"
                :rules="isValidPass"
                class="mt-2 mt-md-4"
                clearable
                hide-details="auto"
                label="Password"
                prepend-inner-icon="mdi-lock"
                required
                type="password"
                variant="outlined"
              />
              <v-text-field
                v-model="confirmPassword"
                :rules="[
                  (v) => !!v || 'Confirm Password is required!',
                  (v) => v === password || 'Confirm password didn\'t match!',
                ]"
                class="mt-2 mt-md-4"
                clearable
                hide-details="auto"
                label="Confirm Password"
                prepend-inner-icon="mdi-lock"
                required
                type="password"
                variant="outlined"
              />

              <div class="d-flex align-center mt-2 mt-md-5">
                <div
                  class="clickable text-center text-secondary"
                  @click="router.push({ name: 'signin' })"
                >
                  Sign in
                </div>
                <v-spacer />
                <v-btn color="primary" type="submit">Submit</v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style></style>
