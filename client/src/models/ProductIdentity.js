export default class ProductIdentity {
  constructor({
    identityNo = null,
    identityType = 10,
    productId = null,
    uuid = null,
    isAvailable = true,
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.identityNo = identityNo;
    this.identityType = identityType;
    this.productId = productId;
    this.uuid = uuid;
    this.isAvailable = isAvailable;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
