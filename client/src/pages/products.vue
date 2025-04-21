<script setup>
import NoItems from "@/components/NoItems.vue";
import { formatDateTime } from "@/others/util.js";
import { useStore } from "vuex";
import PageTitle from "@/components/PageTitle.vue";

definePage({
  name: "products",
  meta: {
    layout: "default",
    title: "Products",
    requiresAuth: true,
  },
});
const store = useStore();

const productHeaders = ref([
  {
    title: "Product Id",
    align: "start",
    key: "productIdentities",
  },
  {
    title: "Name",
    align: "start",
    key: "name",
  },
  {
    title: "Price",
    align: "start",
    key: "price",
  },
  {
    title: "Date of Creation",
    align: "start",
    key: "createdAt",
  },
  {
    title: "",
    key: "actions",
    sortable: false,
  },
]);

const productList = computed(() => {
  return store.state.product.products.map((item) => ({
    ...item,
    createdAt: formatDateTime(item.createdAt),
  }));
});

const pageProduct = ref(1);
const productItemsPerPage = ref(20);
const totalCountProduct = ref(0);
const totalPagesProduct = computed(() =>
  Math.ceil(totalCountProduct.value / productItemsPerPage.value),
);
const productLoading = ref(false);
const productSearch = ref("");

const loadProductItems = ({ fetchTotalCount = true } = {}) => {
  const offset = (pageProduct.value - 1) * productItemsPerPage.value;
  const limit = productItemsPerPage.value;

  return store.dispatch("product/setProductsByUserId", {
    offset,
    limit,
    fetchTotalCount,
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

const productInit = {
  name: null,
  description: null,
  price: null,
  productIdentities: [],
  productImages: [],
  certificates: [],
  manuals: [],
};
const productIdentityInit = {
  identityNo: null,
  identityType: 10,
};

const newProduct = reactive({ ...productInit });
// const newProduct.productIdentities = [{...productIdentityInit}];

const addMoreProductIndentities = () => {
  newProduct.productIdentities = newProduct.productIdentities.concat({
    ...productIdentityInit,
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
  if (newProduct.productImages && newProduct.productImages.length > 0) {
    newProduct.productImages.forEach((file) => {
      formData.append("productImages", file);
    });
  }
  if (newProduct.certificates && newProduct.certificates.length > 0) {
    newProduct.certificates.forEach((file) => {
      formData.append("productCertificates", file);
    });
  }
  if (newProduct.manuals && newProduct.manuals.length > 0) {
    newProduct.manuals.forEach((file) => {
      formData.append("productManuals", file);
    });
  }
  console.log(2, newProduct);
  store.dispatch("product/save", formData).then((res) => {
    store.commit("product/addProduct", {
      ...res.savedProduct,
      productIdentities: res.savedProductIdentities.map((item) => ({
        piId: item.id,
        identityType: item.identityType,
        identityNo: item.identityNo,
      })),
    });
    productDialog.value = !productDialog.value;
  });
};

const fetchData = async () => {
  const { totalCount } = await loadProductItems({ fetchTotalCount: true });
  totalCountProduct.value = totalCount;
};
onMounted(async () => {
  fetchData();
});
</script>

<template>
  <v-container>
    <v-row
      align="center"
      justify="space-between"
    >
      <v-col>
        <page-title
          title="Products"
          :show-back="true"
          :border-b="true"
        >
          <v-row align="center">
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
        <v-sheet
          class="pa-3"
          color="white"
        >
          <v-data-table-server
            v-if="productList.length"
            :headers="productHeaders"
            :items="productList"
            :items-length="totalCountProduct"
            :items-per-page="productItemsPerPage"
            :loading="productLoading"
            :search="productSearch"
            disable-sort
            hide-default-footer
            hide-no-data
            item-value="name"
          >
            <template #item.productIdentities="{ item }">
              <div
                v-for="identity in item.productIdentities"
                :key="identity.piId"
              >
                {{ identity.identityType === 10 && "Serial: " }}
                {{ identity.identityNo }}
              </div>
            </template>

            <template #item.price="{ item }">
              ${{ parseFloat(item.price).toFixed(2) }}
            </template>

            <template #item.pCreatedAt="{ item }">
              {{ item.createdAt }}
            </template>

            <template #item.actions="{ item }">
              <v-menu>
                <template #activator="{ props }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    variant="text"
                    v-bind="props"
                  />
                </template>

                <v-list density="compact">
                  <v-list-item
                    title="Warranty"
                    prepend-icon="mdi-cash"
                    link
                  />
                  <v-list-item
                    title="Edit"
                    prepend-icon="mdi-pencil"
                    link
                  />
                </v-list>
              </v-menu>
            </template>

            <template #bottom>
              <div class="text-center">
                <v-pagination
                  v-model="pageProduct"
                  :length="totalPagesProduct"
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
          <no-items
            v-else
            :closable="false"
            img-src="src/assets/icons/empty-state-1.png"
            variant="image"
          />
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>

  <v-dialog
    v-model="productDialog"
    :width="500"
    persistent
  >
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
            variant="outlined"
            type="number"
          />
          <div
            v-for="(identity, index) in newProduct.productIdentities"
            :key="index"
          >
            <v-text-field
              v-model="identity.identityNo"
              :rules="[(v) => !!v || 'Serial is required!']"
              class="mt-2 mt-md-4"
              clearable
              density="comfortable"
              hide-details="auto"
              :label="`Serial #${index + 1}`"
              rounded="lg"
              variant="outlined"
            />
          </div>
          <v-btn
            color="primary"
            rounded="lg"
            size="small"
            class="mt-2"
            @click="addMoreProductIndentities"
          >
            Add More Serial
          </v-btn>
          <v-file-upload
            v-model="newProduct.productImages"
            title="Upload Product Images"
            density="compact"
            variant="compact"
            class="mt-2 mt-md-4"
            multiple
            clearable
            :hide-browse="false"
          />
          <v-file-upload
            v-model="newProduct.certificates"
            title="Upload Certificates"
            density="compact"
            variant="compact"
            class="mt-2 mt-md-4"
            multiple
            clearable
            :hide-browse="false"
          />
          <v-file-upload
            v-model="newProduct.manuals"
            title="Upload Manuals"
            density="compact"
            variant="compact"
            class="mt-2 mt-md-4"
            multiple
            clearable
            :hide-browse="false"
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
