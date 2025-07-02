const router = require("express").Router();
const productService = require("../service/product");
const importExportService = require("../service/importExport");
const ApiResponse = require("../model/ApiResponse");
const uploadFiles = require("../middleware/upload");
const compressImages = require("../middleware/compress");
const {auth, isAuthenticated} = require("../middleware/auth");
const {
    VUE_BASE_URL,
    getClientIP,
    reverseGeocode,
    getFilePath,
    getLocationFromIP,
} = require("../helpers/util");
const CustomError = require("../model/CustomError");
const mime = require("mime-types");

router.post("/save", auth, uploadFiles(), compressImages, (req, res, next) => {
    productService
        .save({
            payload: {...req.body, userId: req.currentUser.id},
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
            payload: {...req.body},
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
            payload: {...req.query, userId: req.currentUser.id},
        })
        .then((result) => {
            res.status(200).json(new ApiResponse(null, result));
        })
        .catch((err) => next(err));
});

router.get("/getProduct", auth, (req, res, next) => {
    productService
        .getProduct({
            payload: {...req.query},
        })
        .then((result) => {
            res.status(200).json(new ApiResponse(null, result));
        })
        .catch((err) => next(err));
});

router.get("/removeProduct", auth, (req, res, next) => {
    productService
        .removeProduct({
            payload: {...req.query},
        })
        .then((result) => {
            res.status(200).json(new ApiResponse("Product removed!", result));
        })
        .catch((err) => next(err));
});

router.get("/getPublicProduct", async (req, res, next) => {
    productService
        .getPublicProduct({
            payload: {...req.query},
        })
        .then((result) => {
            res.status(200).json(new ApiResponse(null, result));
        })
        .catch((err) => next(err));
});

router.get("/removeProduct", async (req, res, next) => {
    productService
        .removeProduct({
            payload: {...req.query},
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
            const payload = {...req.body};
            const product = await productService.getPublicProduct({
                payload: {productId: payload.newScan.productId, uuid: payload.uuid},
            });
            if (!product) {
                throw new CustomError("Invalid request!", 400);
            }
            if (req.isLoggedIn) {
                payload.newScan.scannedBy = req.currentUser.id;
            }
            const ipAddress = getClientIP(req);
            const location = await getLocationFromIP({ipAddress});

            payload.newScan = {
                ...payload.newScan,
                scanType: "model",
                ipAddress,
                location,
            };

            const savedScan = await productService.saveScan({
                payload: {newScan: payload.newScan},
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
            const payload = {...req.body};
            const product = await productService.getProductWIdentity({
                payload: {
                    productId: payload.newScan.productId,
                    productIdentitiesId: payload.newScan.productIdentitiesId,
                    uuid: payload.uuid,
                },
            });
            const warranty = await productService.getWarrantyWIdentity({
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

            const ipAddress = getClientIP(req);
            const location = await getLocationFromIP({ipAddress});

            payload.newScan = {
                ...payload.newScan,
                scanType: "unit",
                ipAddress,
                location,
            };

            const savedScan = await productService.saveScan({
                payload: {newScan: payload.newScan},
            });
            product.files = product.files.filter((file) => file.fileType === 11);

            res.status(200).json(new ApiResponse(null, {product, warranty}));
        } catch (err) {
            next(err);
        }
    },
);

router.get("/getWarrantyWProduct", auth, async (req, res, next) => {
    try {
        const warranty = await productService.getWarrantyWIdentity({
            payload: {
                productIdentitiesId: req.query.productIdentitiesId,
                uuid: req.query.uuid || "invalidIfNotPresent",
            },
        });

        const product = await productService.getPublicProduct({
            payload: {productId: req.query.productId},
        });

        if (!warranty?.id) {
            return res.status(200).json(new ApiResponse(null, {product}));
        }
        product.files = product.files.filter((file) => file.fileType === 11);

        res.status(200).json(new ApiResponse(null, {warranty, product}));
    } catch (err) {
        next(err);
    }
});

router.get("/getWarranty", auth, (req, res, next) => {
    productService
        .getWarranty({
            payload: {...req.query},
        })
        .then((result) => {
            res.status(200).json(new ApiResponse(null, result));
        })
        .catch((err) => next(err));
});

router.get("/getProductIdentity", auth, (req, res, next) => {
    productService
        .getProductIdentity({
            payload: {...req.query},
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
        }
    });
});

router.post(
    "/bulkImportWarranty",
    auth,
    uploadFiles(),
    async (req, res, next) => {
        try {
            const excelFile = req.files?.warrantyImportExcel?.[0];
            if (!excelFile)
                return res.status(400).json({message: "Excel file required"});

            const result = await importExportService.bulkImportWarranty({
                excelFile,
                userId: req.currentUser.id,
            });
            res.json(
                new ApiResponse(
                    `${result.insertCount} Product warranties imported successfully!`,
                    result,
                ),
            );
        } catch (err) {
            next(err);
        }
    },
);

router.post(
    "/bulkImportProduct",
    auth,
    uploadFiles(),
    async (req, res, next) => {
        try {
            const zipFile = req.files?.productImportZip?.[0];
            if (!zipFile)
                return res.status(400).json({message: "ZIP file required"});

            const result = await importExportService.bulkImportProduct({
                zipFile,
                userId: req.currentUser.id,
            });
            res.json(
                new ApiResponse(
                    `${result.insertCount} Products imported successfully!`,
                    result,
                ),
            );
        } catch (err) {
            next(err);
        }
    },
);

router.get("/bulkExport", auth, async (req, res, next) => {
    try {
        const userId = req.currentUser?.id;
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=product-export.zip",
        );
        res.setHeader("Content-Type", "application/zip");
        await importExportService.bulkExport({userId, writable: res});
    } catch (err) {
        next(err);
    }
});

module.exports = router;
