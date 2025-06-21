const router = require("express").Router();
const customerInsightsService = require("../service/customerInsights");
const ApiResponse = require("../model/ApiResponse");
const { auth } = require("../middleware/auth");

router.get("/getRecentPurchases", auth, async (req, res, next) => {
  try {
    const result = await customerInsightsService.getRecentPurchases({
      payload: {
        userId: req.currentUser.id,
        fetchTotalCount: req.query.fetchTotalCount,
        offset: req.query.offset,
        limit: req.query.limit,
      },
    });

    res.status(200).json(new ApiResponse(null, result));
  } catch (err) {
    next(err);
  }
});

router.get("/getStats", auth, async (req, res, next) => {
  try {
    const result = await customerInsightsService.getStats({
      userId: req.currentUser.id,
    });

    res.status(200).json(new ApiResponse(null, result));
  } catch (err) {
    next(err);
  }
});

router.post("/saveQrCode", auth, async (req, res, next) => {
  try {
    const result = await customerInsightsService.saveQrCode({
      payload: { ...req.body.newQrCode, userId: req.currentUser.id },
    });

    res.status(200).json(new ApiResponse("Saved Successfully!", result));
  } catch (err) {
    next(err);
  }
});

router.get("/getQrCodes", auth, async (req, res, next) => {
  try {
    const result = await customerInsightsService.getQrCodes({
      payload: {
        userId: req.currentUser.id,
        fetchTotalCount: req.query.fetchTotalCount,
        offset: req.query.offset,
        limit: req.query.limit,
      },
    });

    res.status(200).json(new ApiResponse(null, result));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
