const router = require("express").Router();
const productService = require("../service/product");
const ApiResponse = require("../model/ApiResponse");
const uploadFiles = require("../middleware/upload");
const compressImages = require("../middleware/compress");
const { auth, isAuthenticated } = require("../middleware/auth");
const {
  VUE_BASE_URL,
  getClientIP,
  reverseGeocode,
  getFilePath,
} = require("../helpers/util");
const CustomError = require("../model/CustomError");
const mime = require("mime-types");

router.post("/save", auth, uploadFiles(), compressImages, (req, res, next) => {
  productService
    .save({
      payload: { ...req.body, userId: req.currentUser.id },
      files: req.files,
    })
    .then((result) => {
      if (result) {
        res.status(200).json(new ApiResponse("Product added!", result));
      }
    })
    .catch((err) => next(err));
});

router.post("/saveWarranty", auth, (req, res, next) => {
  productService
    .saveWarranty({
      payload: { ...req.body },
    })
    .then((result) => {
      if (result) {
        res.status(200).json(new ApiResponse("Warranty saved!", result));
      }
    })
    .catch((err) => next(err));
});

router.get("/getProductsByUserId", auth, (req, res, next) => {
  productService
    .getProductsByUserId({
      payload: { ...req.query, userId: req.currentUser.id },
    })
    .then((result) => {
      res.status(200).json(new ApiResponse(null, result));
    })
    .catch((err) => next(err));
});

router.get("/getProduct", auth, (req, res, next) => {
  productService
    .getProduct({
      payload: { ...req.query },
    })
    .then((result) => {
      res.status(200).json(new ApiResponse(null, result));
    })
    .catch((err) => next(err));
});

router.get("/removeProduct", auth, (req, res, next) => {
  productService
    .removeProduct({
      payload: { ...req.query },
    })
    .then((result) => {
      res.status(200).json(new ApiResponse("Product removed!", result));
    })
    .catch((err) => next(err));
});

router.get("/getPublicProduct", async (req, res, next) => {
  productService
    .getPublicProduct({
      payload: { ...req.query },
    })
    .then((result) => {
      res.status(200).json(new ApiResponse(null, result));
    })
    .catch((err) => next(err));
});

router.get("/removeProduct", async (req, res, next) => {
  productService
    .removeProduct({
      payload: { ...req.query },
    })
    .then((result) => {
      res.status(200).json(new ApiResponse(null, result));
    })
    .catch((err) => next(err));
});

router.post(
  "/getPublicProductNScan",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const payload = { ...req.body };
      const product = await productService.getPublicProduct({
        payload: { productId: payload.newScan.productId, uuid: payload.uuid },
      });
      if (!product) {
        throw new CustomError("Invalid request!", 400);
      }
      if (req.isLoggedIn) {
        payload.newScan.scannedBy = req.currentUser.id;
      }
      payload.newScan.ipAddress = getClientIP(req);
      const geocodedDetails = await reverseGeocode({
        latitude: payload.newScan.location.latitude,
        longitude: payload.newScan.location.longitude,
      });
      payload.newScan.location = {
        ...payload.newScan.location,
        ...geocodedDetails,
      };
      const savedScan = await productService.saveScan({
        payload: { newScan: payload.newScan },
      });
      res.status(200).json(new ApiResponse(null, product));
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/getWarrantyWProductNScan",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const payload = { ...req.body };
      const product = await productService.getProductWIdentity({
        payload: {
          productId: payload.newScan.productId,
          productIdentitiesId: payload.newScan.productIdentitiesId,
          uuid: payload.uuid,
        },
      });
      const warranty = await productService.getWarranty({
        payload: {
          productIdentitiesId: payload.newScan.productIdentitiesId,
          uuid: payload.uuid,
        },
      });

      if (!product.productIdentity?.id) {
        throw new CustomError("Invalid Request!", 404);
      }
      if (req.isLoggedIn) {
        payload.newScan.scannedBy = req.currentUser.id;
      }
      payload.newScan.ipAddress = getClientIP(req);
      const geocodedDetails = await reverseGeocode({
        latitude: payload.newScan.location.latitude,
        longitude: payload.newScan.location.longitude,
      });
      payload.newScan.location = {
        ...payload.newScan.location,
        ...geocodedDetails,
      };
      const savedScan = await productService.saveScan({
        payload: { newScan: payload.newScan },
      });
      res.status(200).json(new ApiResponse(null, { product, warranty }));
    } catch (err) {
      next(err);
    }
  },
);

router.get("/getWarrantyWProduct", auth, async (req, res, next) => {
  try {
    const warranty = await productService.getWarranty({
      payload: {
        productIdentitiesId: req.query.productIdentitiesId,
        uuid: req.query.uuid || "invalidIfNotPresent",
      },
    });

    const product = await productService.getPublicProduct({
      payload: { productId: req.query.productId },
    });

    if (!warranty?.id) {
      res.status(200).json(new ApiResponse(null, { product }));
    }

    res.status(200).json(new ApiResponse(null, { warranty, product }));
  } catch (err) {
    next(err);
  }
});

router.get("/getWarranty", auth, (req, res, next) => {
  productService
    .getWarranty({
      payload: { ...req.query },
    })
    .then((result) => {
      res.status(200).json(new ApiResponse(null, result));
    })
    .catch((err) => next(err));
});

router.get("/getProductIdentity", auth, (req, res, next) => {
  productService
    .getProductIdentity({
      payload: { ...req.query },
    })
    .then((result) => {
      res.status(200).json(new ApiResponse(null, result));
    })
    .catch((err) => next(err));
});

router.get("/downloadManual", (req, res, next) => {
  const filename = req.query.filename;
  const filePath = getFilePath(filename, "productManuals");
  const contentType = mime.lookup(filename) || "application/octet-stream";

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", contentType);

  res.download(filePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res
        .status(500)
        .json(new ApiResponse("Could not download the file", null));
    } else {
      console.log("File sent successfully.");
    }
  });
});

router.post("/bulkImport", auth, uploadFiles(), async (req, res, next) => {
  try {
    const zipFile = req.files?.importZip?.[0];
    if (!zipFile) return res.status(400).json({ message: "ZIP file required" });

    const result = await productService.bulkImport({
      zipFile,
      userId: req.currentUser.id,
    });
    res.json(new ApiResponse(`${result.productCount} Products imported successfully!`, result));
  } catch (err) {
    next(err);
  }
});

router.get("/bulkExport", auth, async (req, res, next) => {
  try {
    const userId = req.currentUser?.id;

    const stream = await productService.bulkExport({ userId });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=product-export.zip",
    );
    res.setHeader("Content-Type", "application/zip");

    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
