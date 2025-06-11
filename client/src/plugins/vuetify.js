/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */
// lab
import { VTimePicker } from "vuetify/labs/VTimePicker";
import { VFileUpload } from "vuetify/labs/VFileUpload";

// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

// Composables
import { createVuetify } from "vuetify";

const dark = {
  dark: true,
  colors: {
    background: "#253740",
    surface: "#1A1F28",
    // surface: "#10141A",
    primary: "#49627a",
    secondary: "#5C9EFF",
  },
};

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  components: {
    VTimePicker,
    VFileUpload,
  },
  theme: {
    defaultTheme: "dark",
    themes: {
      dark,
    },
  },
});
