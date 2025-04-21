<script setup>
import { useStore } from "vuex";
import { toast } from "vue-sonner";

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
    toast(`Signout successful!`, {
      cardProps: { color: "success" },
      action: {
        label: "Close",
        buttonProps: {
          color: "white",
        },
        onClick() {},
      },
    });
    window.location.href = "/signin";
  })
  .catch((err) => {});
</script>
