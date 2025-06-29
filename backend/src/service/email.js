const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const nodeMailer = require("nodemailer");
const {
  appInfo,
  defaultCurrency,
  generateQrCodeContent,
} = require("../helpers/util");

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, VUE_BASE_URL } =
  process.env;

const transporter = nodeMailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: true,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});
const processAttachments = async (attachments = []) => {
  const result = [];

  for (const attachment of attachments) {
    if (attachment?.type === "qrcode") {
      result.push({
        filename: attachment.filename || "qrcode.png",
        content: attachment.content,
        encoding: "base64",
        cid: "attachmentQrCode", // must match src="cid:attachmentQrCode"
      });
    } else if (attachment?.type === "pdf") {
      result.push({
        filename: attachment.filename || "attachment.pdf",
        content: Buffer.from(attachment.content.output(), "binary"),
      });
    } else {
      result.push(attachment); // add as-is if not QR
    }
  }
  return result;
};

const sendMail = async ({ to, subject, html, attachments }) => {
  const mailOptions = {
    from: `${appInfo.name} <${SMTP_USER}>`,
    to,
    // bcc: '',
    subject,
    html,
    attachments: attachments?.length
      ? await processAttachments(attachments)
      : [],
  };
  return transporter.sendMail(mailOptions);
};

// Compile template once
const resetTemplatePath = path.join(
  __dirname,
  "..",
  "templates",
  "passwordResetEmail.html",
);
const resetTemplateSource = fs.readFileSync(resetTemplatePath, "utf8");
const compileResetTemplate = handlebars.compile(resetTemplateSource);

const purchaseTemplatePath = path.join(
  __dirname,
  "..",
  "templates",
  "purchaseConfirmationEmail.html",
);
const purchaseTemplateSource = fs.readFileSync(purchaseTemplatePath, "utf8");
const compilePurchaseTemplate = handlebars.compile(purchaseTemplateSource);

const sendPurchaseConfirmation = async ({
  to,
  user,
  product,
  productIdentity,
  purchase,
}) => {
  const params = new URLSearchParams();
  params.append("uuid", productIdentity.uuid);
  params.append("scanned", 1);

  const qrCode = {
    contentLink: `${VUE_BASE_URL}/products/${purchase.productId}/${productIdentity.id}?${params.toString()}`,
    link: `${VUE_BASE_URL}/products/${purchase.productId}/${productIdentity.id}/${productIdentity.uuid}`,
  };

  const dashboardLink = `${VUE_BASE_URL}/dashboard`;
  const attachments = [];
  attachments.push({
    type: "qrcode",
    content: await generateQrCodeContent({
      productId: purchase.productId,
      productIdentitiesId: productIdentity.id,
      uuid: productIdentity.uuid,
    }),
  });

  const html = compilePurchaseTemplate({
    user,
    product,
    purchase,
    productIdentity,
    purchaseDate: new Date(purchase.purchaseDate).toLocaleDateString(),
    currency: defaultCurrency.symbol,
    links: {
      home: VUE_BASE_URL,
      dashboard: dashboardLink,
      qrCode: qrCode.link,
      support: SMTP_USER,
    },
    appInfo,
  });

  const subject = `✅ Purchase Confirmation – ${product.name}`;
  return sendMail({ to, subject, html, attachments });
};

const sendPasswordResetEmail = async ({ to, user, token }) => {
  const html = compileResetTemplate({
    user,
    resetLink: `${VUE_BASE_URL}/reset-password/?token=${token}`,
    supportEmail: SMTP_USER,
  });

  const subject = `🔐 Reset Your Password – ${appInfo.name}`;

  return sendMail({ to, subject, html });
};

module.exports = {
  sendMail,
  sendPurchaseConfirmation,
  sendPasswordResetEmail,
};
