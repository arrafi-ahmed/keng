<script setup>
import NoItems from "@/components/NoItems.vue";
import { defaultCurrency, formatDateTime } from "@/others/util.js";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import PageTitle from "@/components/PageTitle.vue";
import Product from "@/models/Product.js";
import ProductIdentity from "@/models/ProductIdentity.js";
import { useDisplay } from "vuetify";
import ConfirmationDialog from "@/components/ConfirmationDialog.vue";

definePage({
  name: "products",
  meta: {
    layout: "default",
    title: "Products",
    requiresAuth: true,
  },
});
const { smAndUp } = useDisplay();
const store = useStore();
const router = useRouter();

const productHeadersCommon = ref([
  {
    title: "Name",
    align: "start",
    key: "name",
  },
  {
    title: "Serial Number",
    align: "start",
    key: "productIdentities",
  },
]);
const productHeadersSmAndUp = ref([
  {
    title: "Price",
    align: "start",
    key: "price",
  },
  {
    title: "Created At",
    align: "start",
    key: "createdAt",
  },
]);
const productHeaders = computed(() => {
  const actionHeader = {
    title: "",
    key: "actions",
    sortable: false,
  };
  if (smAndUp.value) {
    return productHeadersCommon.value
      .concat(productHeadersSmAndUp.value)
      .concat(actionHeader);
  } else {
    return productHeadersCommon.value.concat(actionHeader);
  }
});

const productList = computed(() => {
  return store.state.product.products.map((item) => ({
    ...item,
    createdAt: formatDateTime(item.createdAt),
  }));
});

const page = ref(1);
const itemsPerPage = ref(10);
const totalCount = ref(0);
const totalPages = computed(() =>
  Math.ceil(totalCount.value / itemsPerPage.value),
);
const productLoading = ref(false);
const productSearch = ref("");

const loadProductItems = ({ fetchTotalCount = true } = {}) => {
  const offset = (page.value - 1) * itemsPerPage.value;
  const limit = itemsPerPage.value;
  productLoading.value = true;

  return store
    .dispatch("product/setProductsByUserId", {
      offset,
      limit,
      fetchTotalCount,
    })
    .finally(() => {
      productLoading.value = false;
    });
};

const goNextProduct = async () => {
  await loadProductItems();
};
const goPrevProduct = async () => {
  await loadProductItems();
};
const goFirstProduct = async () => {
  await loadProductItems();
};
const goLastProduct = async () => {
  await loadProductItems();
};

const productDialog = ref(false);
const addProductForm = ref(null);
const isProductFormValid = ref(true);

const newProduct = reactive({ ...new Product() });

const addMoreProductIdentities = () => {
  newProduct.productIdentities = newProduct.productIdentities.concat({
    ...new ProductIdentity(),
  });
};

const handleSubmitProductAdd = async () => {
  await addProductForm.value.validate();
  if (!isProductFormValid.value) return;

  const formData = new FormData();
  formData.append("name", newProduct.name);
  formData.append("description", newProduct.description);
  formData.append("price", newProduct.price);
  formData.append(
    "productIdentities",
    JSON.stringify(newProduct.productIdentities),
  );
  if (newProduct.productImages?.length > 0) {
    newProduct.productImages.forEach((file) => {
      formData.append("productImages", file);
    });
  }
  if (newProduct.certificates?.length > 0) {
    newProduct.certificates.forEach((file) => {
      formData.append("productCertificates", file);
    });
  }
  if (newProduct.manuals?.length > 0) {
    newProduct.manuals.forEach((file) => {
      formData.append("productManuals", file);
    });
  }

  store.dispatch("product/save", formData).then((res) => {
    store.commit("product/addProduct", {
      ...res.savedProduct,
      productIdentities: res.savedProductIdentities.map((item) => ({
        id: item.id,
        identityType: item.identityType,
        identityNo: item.identityNo,
        uuid: item.uuid,
      })),
    });
    productDialog.value = !productDialog.value;
  });
};

const removeProduct = async ({ productId }) => {
  await store.dispatch("product/removeProduct", { productId });
};

const fetchData = async () => {
  const res = await loadProductItems({ fetchTotalCount: true });
  totalCount.value = res.totalCount;
};
onMounted(async () => {
  await fetchData();
});
</script>

<template>
  <v-container>
    <v-row align="center" justify="space-between">
      <v-col>
        <page-title :border-b="true" :show-back="true" title="Products">
          <v-row align="center">
            <v-menu>
              <template #activator="{ props }">
                <v-btn icon="mdi-dots-vertical" v-bind="props" variant="text" />
              </template>
              <v-list density="compact">
                <v-list-item
                  density="compact"
                  prepend-icon="mdi-plus"
                  title="Add Product"
                  @click="productDialog = !productDialog"
                />
              </v-list>
            </v-menu>
          </v-row>
        </page-title>
      </v-col>
      <!--      <v-col cols="auto">-->
      <!--        <div style="width: 250px">-->
      <!--          <v-date-input-->
      <!--            v-model="productDateRange"-->
      <!--            append-inner-icon="mdi-calendar"-->
      <!--            density="compact"-->
      <!--            hide-details="auto"-->
      <!--            label="Select Date"-->
      <!--            multiple="range"-->
      <!--            prepend-icon=""-->
      <!--            variant="outlined"-->
      <!--            @update:model-value="updateProductDateRange"-->
      <!--          />-->
      <!--        </div>-->
      <!--      </v-col>-->
    </v-row>

    <v-row>
      <v-col>
        <v-sheet class="px-0 px-md-3">
          <v-data-table-server
            v-if="productList.length"
            :headers="productHeaders"
            :items="productList"
            :items-length="totalCount"
            :items-per-page="itemsPerPage"
            :loading="productLoading"
            :search="productSearch"
            disable-sort
            hide-default-footer
            hide-no-data
            item-value="name"
          >
            <template #item.productIdentities="{ item }">
              <div v-if="item.productIdentities?.length > 0">
                <div
                  v-for="(identity, index) in item.productIdentities"
                  :key="identity.id"
                >
                  <div class="d-flex align-center justify-space-between my-1">
                    <span>
                      {{ identity.identityNo }}
                    </span>
                    <v-menu>
                      <template #activator="{ props }">
                        <v-btn
                          density="comfortable"
                          icon="mdi-dots-vertical"
                          size="small"
                          v-bind="props"
                          variant="text"
                        />
                      </template>
                      <v-list density="compact">
                        <v-list-item
                          density="compact"
                          link
                          prepend-icon="mdi-shield-check"
                          title="Warranty"
                          @click="
                            router.push({
                              name: 'product-warranty',
                              params: {
                                productId: item.id,
                                productIdentitiesId: identity.id,
                              },
                            })
                          "
                        />
                        <v-list-item
                          density="compact"
                          link
                          prepend-icon="mdi-qrcode"
                          title="Unit QR Code"
                          @click="
                            router.push({
                              name: 'qrcode-view-unit',
                              params: {
                                productId: item.id,
                                productIdentitiesId: identity.id,
                                uuid: identity.uuid,
                              },
                            })
                          "
                        />
                      </v-list>
                    </v-menu>
                  </div>
                  <v-divider
                    v-if="index < item.productIdentities?.length - 1"
                  />
                </div>
              </div>
              <div v-else>No data</div>
            </template>

            <template #item.price="{ item }">
              {{ defaultCurrency.symbol }}
              {{ parseFloat(item.price).toFixed(2) }}
            </template>

            <template #item.createdAt="{ item }">
              {{ item.createdAt }}
            </template>

            <template #item.actions="{ item }">
              <v-menu>
                <template #activator="{ props }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    v-bind="props"
                    variant="text"
                  />
                </template>

                <v-list density="compact">
                  <v-list-item
                    link
                    prepend-icon="mdi-pencil"
                    title="Edit"
                    @click="
                      router.push({
                        name: 'product-edit',
                        params: { productId: item.id },
                      })
                    "
                  />
                  <v-list-item
                    density="compact"
                    link
                    prepend-icon="mdi-qrcode"
                    title="Model QR Code"
                    @click="
                      router.push({
                        name: 'qrcode-view-model',
                        params: {
                          productId: item.id,
                          uuid: item.uuid,
                        },
                      })
                    "
                  />
                  <v-divider class="my-1" />
                  <confirmation-dialog
                    @confirm="removeProduct({ productId: item.id })"
                  >
                    <template #activator="{ onClick }">
                      <v-list-item
                        class="text-error"
                        link
                        prepend-icon="mdi-delete"
                        title="Delete"
                        @click.stop="onClick"
                      />
                    </template>
                  </confirmation-dialog>
                </v-list>
              </v-menu>
            </template>

            <template #bottom>
              <div class="text-center">
                <v-pagination
                  v-model="page"
                  :length="totalPages"
                  :total-visible="1"
                  class="mt-2"
                  density="compact"
                  show-first-last-page
                  @first="goFirstProduct"
                  @last="goLastProduct"
                  @next="goNextProduct"
                  @prev="goPrevProduct"
                />
              </div>
            </template>
          </v-data-table-server>
          <no-items v-else />
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>

  <v-dialog v-model="productDialog" :max-width="600" persistent>
    <v-card>
      <v-card-title class="d-flex justify-space-between">
        <h2>Add Product</h2>
        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          @click="productDialog = !productDialog"
        />
      </v-card-title>
      <v-card-text>
        <v-form
          ref="addProductForm"
          v-model="isProductFormValid"
          fast-fail
          @submit.prevent="handleSubmitProductAdd"
        >
          <v-text-field
            v-model="newProduct.name"
            :rules="[(v) => !!v || 'Name is required!']"
            class="mt-2"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Name"
            rounded="lg"
            variant="outlined"
          />
          <v-textarea
            v-model="newProduct.description"
            :rules="[(v) => !!v || 'Description is required!']"
            class="mt-2 mt-md-4"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Description"
            rounded="lg"
            variant="outlined"
          />
          <v-text-field
            v-model="newProduct.price"
            :rules="[(v) => !!v || 'Price is required!']"
            class="mt-2 mt-md-4"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Price"
            rounded="lg"
            type="number"
            variant="outlined"
          />
          <div
            v-for="(identity, index) in newProduct.productIdentities"
            :key="index"
          >
            <v-text-field
              v-model="identity.identityNo"
              :label="`Serial #${index + 1}`"
              :rules="[(v) => !!v || 'Serial is required!']"
              class="mt-2 mt-md-4"
              clearable
              density="comfortable"
              hide-details="auto"
              rounded="lg"
              variant="outlined"
            />
          </div>
          <v-btn
            class="mt-2"
            color="primary"
            rounded="lg"
            size="small"
            @click="addMoreProductIdentities"
          >
            Add More Serial
          </v-btn>
          <v-file-upload
            v-model="newProduct.productImages"
            :hide-browse="false"
            class="mt-2 mt-md-4"
            clearable
            density="compact"
            multiple
            title="Upload Product Images"
            variant="compact"
          />
          <v-file-upload
            v-model="newProduct.certificates"
            :hide-browse="false"
            class="mt-2 mt-md-4"
            clearable
            density="compact"
            multiple
            title="Upload Certificates"
            variant="compact"
          />
          <v-file-upload
            v-model="newProduct.manuals"
            :hide-browse="false"
            class="mt-2 mt-md-4"
            clearable
            density="compact"
            multiple
            title="Upload Manuals"
            variant="compact"
          />

          <v-card-actions class="mt-2 mt-md-4">
            <v-spacer />
            <v-btn
              color="secondary"
              rounded="lg"
              size="large"
              variant="flat"
              @click="productDialog = !productDialog"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              rounded="lg"
              size="large"
              type="submit"
              variant="flat"
            >
              Save
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
