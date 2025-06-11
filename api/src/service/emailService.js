const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const nodeMailer = require("nodemailer");
const { appInfo, defaultCurrency } = require("../helpers/util");

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

const sendMail = async (to, subject, html) => {
  return transporter.sendMail({
    from: `${appInfo.name} <${SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

// Load and compile the email template once
const templatePath = path.join(
  __dirname,
  "..",
  "templates",
  "purchaseConfirmationEmail.html",
);
const templateSource = fs.readFileSync(templatePath, "utf8");
const compilePurchaseTemplate = handlebars.compile(templateSource);

const sendPurchaseConfirmation = async ({ to, user, product, purchase }) => {
  const html = compilePurchaseTemplate({
    user,
    product,
    purchase,
    purchased_price: purchase.purchased_price.toFixed(2),
    purchase_date: new Date(purchase.purchase_date).toLocaleDateString(),
    currency: defaultCurrency.symbol,
    links: {
      home: VUE_BASE_URL,
      dashboard: `${VUE_BASE_URL}/dashboard`,
      support: SMTP_USER,
    },
    appInfo,
  });

  const subject = `✅ Purchase Confirmation – ${product.name}`;

  return sendMail(to, subject, html);
};

// Compile password reset template once
const resetTemplatePath = path.join(__dirname, "..", "templates", "passwordResetEmail.html");
const resetTemplateSource = fs.readFileSync(resetTemplatePath, "utf8");
const compileResetTemplate = handlebars.compile(resetTemplateSource);

// 🎯 New: Send password reset email
const sendPasswordResetEmail = async ({ to, user, token }) => {
  const html = compileResetTemplate({
    user,
    resetLink: `${VUE_BASE_URL}/reset-password/?token=${token}`,
    supportEmail: SMTP_USER,
  });

  const subject = `🔐 Reset Your Password – ${appInfo.name}`;

  return sendMail(to, subject, html);
};

module.exports = {
  sendMail,
  sendPurchaseConfirmation,
  sendPasswordResetEmail,
};
