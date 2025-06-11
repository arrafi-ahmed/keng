class QrCode {
  constructor({
    userId = null,
    qrCode = null,
    title = null,
  } = {}) {
    this.userId = userId;
    this.qrCode = qrCode;
    this.title = title;
  }
}

export default QrCode;
