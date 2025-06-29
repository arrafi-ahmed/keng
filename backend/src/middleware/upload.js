const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {fileConfig, getConfigByFieldname} = require("../helpers/fileFields");
const {generateFilename} = require("../helpers/util");

// Ensure destination folders exist
Object.values(fileConfig).forEach(({dir}) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const config = getConfigByFieldname(file.fieldname);
        cb(null, config?.dir || path.join(__dirname, "..", "..", "public", "tmp"));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const unique = generateFilename({prefix: file.fieldname, ext});
        cb(null, unique);
    },
});

const upload = multer({storage});

const uploadFiles = () => {
    return upload.fields(
        Object.values(fileConfig).map(({fieldname, maxCount}) => ({
            name: fieldname,
            maxCount,
        })),
    );
};

module.exports = uploadFiles;
