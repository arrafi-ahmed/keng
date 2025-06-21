<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { isValidEmail } from "@/others/util";
import { useDisplay } from "vuetify";

definePage({
  name: "signin", // Set the route name to 'signin'
  meta: {
    layout: "default",
    title: "Signin",
    requiresNoAuth: true,
  },
});

const { mobile } = useDisplay();
const store = useStore();
const router = useRouter();

const email = ref(null);
const password = ref(null);
const calcHome = computed(() => store.getters["user/calcHome"]);

const visible = ref(false);
const form = ref(null);
const isFormValid = ref(true);

const signinUser = async () => {
  await form.value.validate();
  if (!isFormValid.value) return;

  store
    .dispatch("user/signin", {
      email: email.value,
      password: password.value,
    })
    .then((result) => {
      router.push(calcHome.value);
    });
};
const dialog = ref(false);
const resetEmail = ref(null);
const resetForm = ref(null);
const isResetFormValid = ref(true);
const isRemember = ref(false);

const handleSubmitResetPassword = async () => {
  await resetForm.value.validate();
  if (!isResetFormValid.value) return;

  store
    .dispatch("user/requestResetPass", { resetEmail: resetEmail.value })
    .then((res) => {
      dialog.value = !dialog.value;
    })
    .catch((err) => {});
};
</script>

<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col :cols="12" :lg="6" :md="7" :sm="8">
        <v-card
          class="mx-auto pa-4 pa-md-8 my-2 my-md-5"
          elevation="0"
          max-width="700"
          rounded="lg"
        >
          <v-card-title class="text-center font-weight-bold">
            <h1>Login</h1>
          </v-card-title>
          <v-card-subtitle class="text-center">
            <h2 class="font-weight-regular">Hi, Welcome back 👋</h2>
          </v-card-subtitle>
          <v-card-text>
            <v-form
              ref="form"
              v-model="isFormValid"
              fast-fail
              @submit.prevent="signinUser"
            >
              <!-- Email Address -->
              <v-text-field
                v-model="email"
                :rules="[
                  (v) => !!v || 'Email is required!',
                  (v) => isValidEmail(v) || 'Invalid Email',
                ]"
                class="mt-2 mt-md-4"
                clearable
                density="comfortable"
                hide-details="auto"
                label="Email"
                required
                rounded="lg"
                variant="outlined"
              />

              <!-- Password -->
              <v-text-field
                v-model="password"
                :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                :rules="[(v) => !!v || 'Password is required!']"
                :type="visible ? 'text' : 'password'"
                class="mt-2 mt-md-7"
                clearable
                density="comfortable"
                hide-details="auto"
                label="Password"
                required
                rounded="lg"
                variant="outlined"
                @click:append-inner="visible = !visible"
              />

              <div class="d-flex align-center justify-end my-2">
                <!--                <v-checkbox-->
                <!--                  v-model="isRemember"-->
                <!--                  center-affix-->
                <!--                  color="primary"-->
                <!--                  hide-details="auto"-->
                <!--                  label="Remember me"-->
                <!--                />-->
                <span
                  class="clickable text-secondary mt-1 mt-sm-0 text-center"
                  @click="dialog = !dialog"
                >
                  Forgot Password?
                </span>
              </div>
              <v-btn
                :density="mobile ? 'comfortable' : 'default'"
                block
                color="primary"
                rounded="lg"
                size="large"
                type="submit"
              >
                Login
              </v-btn>
              <div class="text-center mt-2 mt-md-4">
                Not registered yet?
                <span
                  class="clickable text-secondary"
                  @click="
                    router.push({
                      name: 'register',
                    })
                  "
                >
                  Create an account
                </span>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <v-dialog v-model="dialog" :width="450">
    <v-card class="pa-5">
      <v-card-title class="text-center">
        <h2>Forgot Password?</h2>
      </v-card-title>
      <v-card-subtitle class="text-center text-wrap">
        Please enter the email address you'd like your password reset
        informations sent to
      </v-card-subtitle>
      <v-card-text>
        <v-form
          ref="resetForm"
          v-model="isResetFormValid"
          fast-fail
          @submit.prevent="handleSubmitResetPassword"
        >
          <v-text-field
            v-model="resetEmail"
            :rules="[
              (v) => !!v || 'Email is required!',
              (v) => isValidEmail || 'Invalid Email',
            ]"
            class="mt-2"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Email"
            rounded="lg"
            variant="outlined"
          />

          <v-card-actions>
            <v-btn
              :density="mobile ? 'comfortable' : 'default'"
              block
              class="mx-auto mt-2 mt-md-4"
              color="primary"
              rounded="lg"
              size="large"
              type="submit"
              variant="elevated"
            >
              Request reset link
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style></style>
