export default class ProductIdentity {
  constructor({ identityNo = null, identityType = 10 } = {}) {
    this.identityNo = identityNo;
    this.identityType = identityType;
  }
}
