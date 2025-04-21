const sharp = require("sharp");
const fs = require("fs");
const { getConfigByFieldname } = require("../helpers/fileFields");
const path = require("path");

const compressImages = async (req, res, next) => {
  if (!req.files) return next();

  try {
    const allFiles = Object.entries(req.files).flatMap(([_, files]) => files);

    await Promise.all(
      allFiles.map(async (file) => {
        const config = getConfigByFieldname(file.fieldname);
        if (!config?.maxWidth) return;

        const newPath = file.path.replace(path.extname(file.path), ".jpeg");

        await sharp(file.path)
          .resize({ width: config.maxWidth })
          .jpeg({ quality: 70 })
          .toFile(newPath);

        if (file.path !== newPath) {
          await fs.promises.unlink(file.path); // delete original only if needed
        }

        file.path = newPath;
        file.filename = path.basename(newPath);
        file.size = (await fs.promises.stat(newPath)).size;
      }),
    );

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = compressImages;
