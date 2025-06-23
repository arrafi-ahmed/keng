<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { isValidEmail, isValidPass, showApiQueryMsg } from "@/others/util";
import { useDisplay } from "vuetify";

definePage({
  name: "register",
  meta: {
    layout: "default",
    title: "Register",
    requiresNoAuth: true,
  },
});

const { mobile } = useDisplay();
const router = useRouter();
const userInit = {
  name: null,
  email: null,
  password: null,
  // role:
  //   route.params.role === "team"
  //     ? "team_manager"
  //       : null,
};
const user = reactive({ ...userInit });
const confirmPassword = ref(null);
const visible = ref(false);
const form = ref(null);
const isFormValid = ref(true);

const registerUser = async () => {
  await form.value.validate();
  if (!isFormValid.value) return;

  $axios.post("/user/save", user).then((res) => {
    router.push({
      name: "signin",
    });
  });
};
onMounted(() => {
  showApiQueryMsg();
});
</script>
<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col :cols="12" :lg="6" :md="6" :sm="6">
        <v-card
          class="mx-auto pa-4 pa-md-8 my-2 my-md-5"
          elevation="0"
          max-width="600"
          rounded="lg"
        >
          <v-card-title class="text-center font-weight-bold">
            <h1>Register</h1>
          </v-card-title>
          <v-card-subtitle class="text-center">
            <!--            <h2 class="font-weight-regular">Hi, Welcome back 👋</h2>-->
          </v-card-subtitle>
          <v-card-text>
            <v-form
              ref="form"
              v-model="isFormValid"
              fast-fail
              @submit.prevent="registerUser"
            >
              <!-- Full Name -->
              <v-text-field
                v-model="user.name"
                :rules="[
                  (v) => !!v || 'Name is required!',
                  (v) =>
                    (v && v.length <= 50) || 'Must not exceed 50 characters',
                ]"
                class="mt-2 mt-md-4"
                clearable
                density="comfortable"
                hide-details="auto"
                label="Name"
                required
                rounded="lg"
                variant="outlined"
              />

              <!-- Email Address -->
              <v-text-field
                v-model="user.email"
                :rules="[
                  (v) => !!v || 'Email is required!',
                  (v) => isValidEmail(v) || 'Invalid Email',
                ]"
                class="mt-2 mt-md-7"
                clearable
                density="comfortable"
                hide-details="auto"
                label="Email Address"
                required
                rounded="lg"
                variant="outlined"
              />

              <!-- Password -->
              <v-text-field
                v-model="user.password"
                :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                :rules="isValidPass"
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
              <v-text-field
                v-model="confirmPassword"
                :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                :rules="[
                  (v) => !!v || 'Confirm Password is required!',
                  (v) =>
                    v === user.password || 'Confirm password didn\'t match!',
                ]"
                :type="visible ? 'text' : 'password'"
                class="mt-2 mt-md-7"
                clearable
                density="comfortable"
                hide-details="auto"
                label="Confirm Password"
                required
                rounded="lg"
                variant="outlined"
                @click:append-inner="visible = !visible"
              />

              <!-- Register Button -->
              <v-btn
                :density="mobile ? 'comfortable' : 'default'"
                block
                class="mt-2 mt-md-7"
                color="primary"
                rounded="lg"
                size="large"
                @click="registerUser"
              >
                Register
              </v-btn>

              <div class="mt-2 mt-md-4 text-center">
                <span
                  class="clickable text-secondary"
                  @click="router.push({ name: 'signin' })"
                >
                  Already registered?
                </span>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style></style>
