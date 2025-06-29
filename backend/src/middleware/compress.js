const sharp = require("sharp");
const fs = require("fs");
const {getConfigByFieldname} = require("../helpers/fileFields");
const path = require("path");
const {generateFilename} = require("../helpers/util");

const compressImages = async (req, res, next) => {
    if (!req.files) return next();

    try {
        const allFiles = Object.entries(req.files).flatMap(([_, files]) => files);

        await Promise.all(
            allFiles.map(async (file) => {
                const config = getConfigByFieldname(file.fieldname);
                if (!config?.maxWidth) return;

                const originalPath = file.path;
                const originalDir = path.dirname(originalPath);
                const originalExt = path.extname(originalPath);
                const originalName = path.basename(originalPath, originalExt);
                const tempPath = path.join(
                    originalDir,
                    `${originalName}_temp${originalExt}`,
                );
                const newPath = path.join(
                    originalDir,
                    generateFilename({prefix: config.fieldname, ext: ".jpeg"}),
                );

                await sharp(originalPath)
                    .resize({width: config.maxWidth})
                    .jpeg({quality: 70})
                    .toFile(newPath);

                await fs.promises.unlink(originalPath);

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
