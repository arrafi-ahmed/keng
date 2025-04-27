const router = require("express").Router();
const productService = require("../service/product");
const ApiResponse = require("../model/ApiResponse");
const uploadFiles = require("../middleware/upload");
const compressImages = require("../middleware/compress");
const { auth } = require("../middleware/auth");

router.post("/save", auth, uploadFiles(), compressImages, (req, res, next) => {
  productService
    .save({
      payload: { ...req.body, userId: req.currentUser.id },
      files: req.files,
    })
    .then((result) => {
      if (result) {
        res.status(200).json(new ApiResponse("Product added!", result ));
      }
    })
    .catch((err) => next(err));
});

router.get("/getProductsByUserId", auth, (req, res, next) => {
  productService
    .getProductsByUserId({
      query: { ...req.query, userId: req.currentUser.id },
    })
    .then((result) => {
      res.status(200).json(new ApiResponse(null, result));
    })
    .catch((err) => next(err));
});

router.get("/getProduct", auth, (req, res, next) => {
  productService
    .getProduct({
      query: { ...req.query },
    })
    .then((result) => {
      res.status(200).json(new ApiResponse(null, result));
    })
    .catch((err) => next(err));
});

module.exports = router;
