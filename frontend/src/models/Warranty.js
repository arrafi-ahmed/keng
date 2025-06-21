class Warranty {
  constructor({
    warrantyStartDate,
    warrantyExpirationDate,
    authenticityConfirmation = null,
    warrantyConditions = null,
    voidConditions = null,
    supportContact = null,
    usageAdvice = null,
  } = {}) {
    this.warrantyStartDate = warrantyStartDate;
    this.warrantyExpirationDate = warrantyExpirationDate;
    this.authenticityConfirmation = authenticityConfirmation;
    this.warrantyConditions = warrantyConditions;
    this.voidConditions = voidConditions;
    this.supportContact = supportContact;
    this.usageAdvice = usageAdvice;
  }
}

export default Warranty;
