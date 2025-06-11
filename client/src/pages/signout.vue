<script setup>
import { useStore } from "vuex";

definePage({
  name: "signout",
  meta: {
    requiresAuth: true,
  },
});

const store = useStore();
store
  .dispatch("user/signout")
  .then((res) => {
    store.commit("addSnackbar", {
      text: 'Signout successful!',
      color: 'success',
    });
    window.location.href = "/signin";
  })
</script>
