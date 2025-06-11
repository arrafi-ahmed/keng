class Scan {
  constructor({
    productId = null,
    productIdentitiesId = null,
    scanType = null,
    scannedAt = null,
    scannedBy = null,
    location = null,
    ipAddress = null,
  } = {}) {
    this.productId = productId;
    this.productIdentitiesId = productIdentitiesId;
    this.scanType = scanType;
    this.scannedAt = scannedAt;
    this.scannedBy = scannedBy;
    this.location = location;
    this.ipAddress = ipAddress;
  }
}

export default Scan;
