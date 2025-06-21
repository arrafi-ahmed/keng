const router = require("express").Router();
const stripeService = require("../service/stripe");
const ApiResponse = require("../model/ApiResponse");
const { auth } = require("../middleware/auth");

router.post("/createPaymentIntent", auth, async (req, res, next) => {
  const { productId } = req.body;
  stripeService
    .createPaymentIntent({ payload: { productId, userId: req.currentUser.id } })
    .then((result) => {
      res.status(200).json(new ApiResponse(null, result));
    })
    .catch((err) => {
      next(err);
    });
});

const webhook = async (req, res, next) => {
  stripeService
    .webhook(req)
    .then((result) => {
      res.status(200).send(); //response sent to stripe
    })
    .catch((err) => {
      res.status(400).send(); //response sent to stripe}
    });
};
module.exports = { router, webhook };

// STRIPE_SECRET=sk_test_51OGwtGBMhRW3cU8sZUa5W1AiNhaWjmf3Jf6ZpYiS1nUILOS2OG631OlYZQx1gaqqJFr8eKK8cYJYPBQ3GSRXoE0M00U6fRikMw
// STRIPE_PUBLIC=pk_test_51OGwtGBMhRW3cU8s5NpqQQ4hyeFxdgshJL2AThqF7GCLykpGVvGYZB60MMYR4RVAEBSHSpb8O0CwbJe0qVILPQMe002Pj9IMyT
// STRIPE_WEBHOOK_SECRET=whsec_4dac894835098fe20d62e9ca72c21c436bd4a7c8b342b92a2ed2c390c01b99db