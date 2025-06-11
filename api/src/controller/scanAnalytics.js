const router = require("express").Router();
const scanAnalyticsService = require("../service/scanAnalytics");
const ApiResponse = require("../model/ApiResponse");
const { auth, isAuthenticated, isAdmin } = require("../middleware/auth");
const CustomError = require("../model/CustomError");

router.get("/getScanAnalytics", auth, isAdmin, async (req, res, next) => {
  try {
    const totalScanCount = await scanAnalyticsService.getTotalScanCount({
      userId: req.currentUser.id,
    });
    const monthlyScanCount = await scanAnalyticsService.getMonthlyScanCount({
      userId: req.currentUser.id,
    });
    const dailyScanCount = await scanAnalyticsService.getDailyScanCount({
      userId: req.currentUser.id,
    });
    const scanByLocation = await scanAnalyticsService.getScanByLocation({
      userId: req.currentUser.id,
    });

    res.status(200).json(
      new ApiResponse(null, {
        totalScanCount,
        monthlyScanCount,
        dailyScanCount,
        scanByLocation,
      }),
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router;
