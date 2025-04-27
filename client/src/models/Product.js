import ProductIdentity from "./ProductIdentity";

export default class Product {
  constructor({
    name = null,
    description = null,
    price = null,
    productIdentities = [new ProductIdentity()],
    productImages = [],
    certificates = [],
    manuals = [],
  } = {}) {
    this.name = name;
    this.description = description;
    this.price = price;
    this.productIdentities = productIdentities;
    this.productImages = productImages;
    this.certificates = certificates;
    this.manuals = manuals;
  }
}
