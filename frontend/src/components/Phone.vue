<script setup>
import { defineEmits, defineProps, onMounted, reactive, ref } from "vue";
import { useDisplay } from "vuetify";

const { inputItem, customClass, rounded, variant, density } = defineProps([
  "inputItem",
  "customClass",
  "rounded",
  "variant",
  "density",
]);
const { mobile } = useDisplay();
const emit = defineEmits(["updatePhone"]);

// phone input
const selectedCountry = reactive({
  flag: null,
  name: null,
  code: null,
  dialCode: null,
});

const formatInputItemTitle = ({ flag, code, name, dialCode }) => {
  return (flag ? flag : code) + " " + name + " " + dialCode;
};
const code = ref(null);
const phone = ref(null);

const formatPhoneInput = () => {
  const formattedPhone = `${selectedCountry.dialCode}${phone.value}`;
  emit("updatePhone", { formattedPhone });
};

const formatSelectedDialCode = (selectedCode) => {
  const { flag, code, name, dialCode } = inputItem.options.find(
    (item) => item.code == selectedCode,
  );
  Object.assign(selectedCountry, {
    ...selectedCountry,
    flag,
    code,
    name,
    dialCode,
  });
};
// set initial selection to uk
onMounted(() => {
  const ukOption = inputItem.options.find((option) => option.code === "IT");
  if (ukOption) {
    code.value = ukOption.code;
    formatSelectedDialCode(code.value);
  }
});
</script>

<template>
  <v-row
    class="phone"
    no-gutters
  >
    <v-col cols="auto">
      <v-select
        v-model="code"
        :class="['dialCode', customClass]"
        :density="density"
        :item-title="formatInputItemTitle"
        :items="inputItem.options"
        :menu-props="
          mobile
            ? { maxHeight: '300px', width: '100%' }
            : { maxHeight: '300px', width: '300px' }
        "
        :rounded="`s-${rounded} e-0`"
        :rules="[(v) => !!v || !inputItem.required || 'required']"
        :variant="variant"
        hide-details="auto"
        item-value="code"
        @update:model-value="formatSelectedDialCode"
      >
        <template #selection="{}">
          <v-row no-gutters>
            <v-col cols="auto">
              <span>{{ selectedCountry.flag }}</span>
            </v-col>
            <v-col
              class="flex-grow-1 ml-2"
              cols="auto"
            >
              <span>{{ selectedCountry.dialCode }}</span>
            </v-col>
          </v-row>
        </template>
      </v-select>
    </v-col>
    <v-col
      class="flex-grow-1"
      cols="auto"
    >
      <v-text-field
        v-model="phone"
        :class="['mt-2 mt-md-4', customClass]"
        :density="density"
        :label="inputItem.text"
        :rounded="`s-0 e-${rounded}`"
        :rules="[(v) => !!v || !inputItem.required || 'required!']"
        :variant="variant"
        clearable
        hide-details="auto"
        @update:model-value="formatPhoneInput"
      >
        <template #label>
          <span>{{ inputItem.text }}</span>
          <span
            v-if="inputItem.required"
            class="text-error"
          > *</span>
        </template>
      </v-text-field>
    </v-col>
  </v-row>
</template>

<style>
.phone .dialCode .v-field__input {
  padding: 5px 0 5px 10px !important;
}

.phone .dialCode .v-field--appended {
  padding-inline-end: 2px;
}

.max-w-40 {
  max-width: 40px;
}
</style>
