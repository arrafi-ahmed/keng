const path = require("path");

// Base public directory
const publicDir = path.join(__dirname, "..", "..", "public");

// Centralized configuration for file fieldnames
const fileConfig = {
  userImages: {
    fieldname: "userImages",
    dir: path.join(publicDir, "user-images"),
    maxWidth: 400,
  },
  productImages: {
    fieldname: "productImages",
    dir: path.join(publicDir, "product-images"),
    maxWidth: 1200,
  },
  productCertificates: {
    fieldname: "productCertificates",
    dir: path.join(publicDir, "product-certificates"),
    // Not compressed (PDF or other files)
  },
  productManuals: {
    fieldname: "productManuals",
    dir: path.join(publicDir, "product-manuals"),
    // Not compressed
  },
  importZip: {
    fieldname: "importZip",
    dir: path.join(publicDir, "tmp"),
    // Not compressed
  },
};

const getConfigByFieldname = (fieldname) => {
  return (
    Object.values(fileConfig).find((cfg) => cfg.fieldname === fieldname) || null
  );
};

module.exports = {
  fileConfig,
  getConfigByFieldname,
};
