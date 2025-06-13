const { VUE_BASE_URL, STRIPE_SECRET } = process.env;
const stripe = require("stripe")(STRIPE_SECRET);
const { sql } = require("../db");
const CustomError = require("../model/CustomError");
const productService = require("./product");
const userService = require("./user");
const { defaultCurrency, generateQrCode } = require("../helpers/util");
const { sendPurchaseConfirmation } = require("./email");

exports.createPaymentIntent = async ({ payload: { productId, userId } }) => {
  const product = await productService.getProductOnly({
    payload: { productId },
  });
  if (!product) {
    throw new CustomError("Product not found");
  } else if (product.availableStock < 1) {
    throw new CustomError("Product not available");
  }
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(product.price * 100),
    currency: defaultCurrency.code,
    metadata: {
      productId,
      userId,
      purchasedPrice: product.price,
    },
    automatic_payment_methods: { enabled: true }, // modern best practice
  });

  return { clientSecret: paymentIntent.client_secret, product };
};

exports.webhook = async (req) => {
  let data;
  let eventType;
  const isDev = process.env.NODE_ENV !== "production";
  // Check if webhook signing is configured.
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!isDev && !webhookSecret) {
    throw new CustomError("Missing STRIPE_WEBHOOK_SECRET in production");
  }
  if (webhookSecret) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers["stripe-signature"];

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret,
      );
    } catch (err) {
      console.error(err);
      throw new CustomError(err.message, 400, err);
    }
    // Extract the object from the event.
    data = event.data;
    eventType = event.type;
  } else if (isDev) {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  } else {
    throw new Error(
      "Invalid webhook configuration. Check environment and STRIPE_WEBHOOK_SECRET.",
    );
  }

  let responseMsg = "";
  switch (eventType) {
    case "payment_intent.succeeded":
      try {
        const paymentIntent = data.object;
        const metadata = paymentIntent.metadata;

        const userId = parseInt(metadata.userId, 10);
        const productId = parseInt(metadata.productId, 10);
        const purchasedPrice = parseFloat(metadata.purchasedPrice);

        // Step 1: Get an available serial
        const [identity] = await sql`
          SELECT id, identity_no
          FROM product_identities
          WHERE product_id = ${productId}
            AND is_available = TRUE
          ORDER BY id ASC LIMIT 1`;

        if (!identity) {
          console.error("No available serials for this product", productId);
          throw new Error("No available serials for this product");
        }

        // Step 2: Assign to purchase
        const purchase = {
          userId,
          productId,
          productIdentitiesId: identity.id,
          purchasedPrice,
          paymentStatus: 1,
        };

        const [savedPurchase] = await sql`
          INSERT INTO purchases ${sql(purchase)} ON CONFLICT(id) DO
          UPDATE SET ${sql(purchase)}
            RETURNING *`;

        // Step 3: Mark serial as used
        await sql`
          UPDATE product_identities
          SET is_available = FALSE,
              updated_at   = NOW()
          WHERE id = ${identity.id}`;

        // Step 4: Reduce product stock
        await productService.reduceStock({ productId });

        // Step 5: Send purchase confirmation
        const user = await userService.getUserById({ id: userId });
        const product = await productService.getProductOnly({
          payload: { productId },
        });

        const qrCodeBase64 = await generateQrCode({
          productId: product.id,
          productIdentitiesId: identity.id,
          uuid: identity.uuid,
        });
        await sendPurchaseConfirmation({
          to: user.email,
          user,
          product,
          purchase: savedPurchase,
          serial: identity.identityNo,
          qrCode: qrCodeBase64,
        });

        responseMsg = "Purchase successful!";
        break;
      } catch (error) {
        console.error(error);
      }
    // // subscription created successfully
    // case "checkout.session.completed":
    //   const checkoutSessionCompleted = data.object;
    //
    //   responseMsg = "Purchase successful!";
    //   break;
    //
    // // fired immediately when customer cancel subscription
    // case "customer.subscription.updated":
    //   break;
    //
    // // fired at end of period when subscription expired
    // case "customer.subscription.deleted":
    //   break;
    //
    // // subscription auto renewal succeeded
    // case "invoice.paid":
    //   break;
    //
    // // subscription auto renewal failed
    // case "invoice.payment_failed":
    //   break;

    // ... handle other event types
    default:
      console.error(`Unhandled event type ${eventType}`);
  }

  return responseMsg;
};
/*
stripe trigger payment_intent.succeeded \
--override payment_intent:metadata.userId=1 \
--override payment_intent:metadata.productId=101 \
--override payment_intent:metadata.purchasedPrice=432
 */
