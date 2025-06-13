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
    header: "#2A3A47",
    background: "#2A3A47",
    surface: "#3b4d59",
    primary: "#58a6ff",
    secondary: "#00bfa5",
    success: "#4CAF50",
    error: "#EF5350",
    "on-background": "#E8EFF5",
    "on-surface": "#E8EFF5",
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
