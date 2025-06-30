const {sql} = require("../db");
const path = require("path");
const fs = require("fs/promises");
const fsSync = require("fs");
const unzipper = require("unzipper");
const {generateImportedFileName, VUE_BASE_URL} = require("../helpers/util");
const ExcelJS = require("exceljs");
const QRCode = require("qrcode");
const {v4: uuidv4} = require("uuid");
const {PassThrough} = require("stream");
const archiver = require("archiver");
const productService = require("../service/product");
const PUBLIC_DIR = path.join(__dirname, "..", "..", "public");
const QR_BASE = path.join(PUBLIC_DIR, "qr");

exports.bulkImportWarranty = async ({excelFile, userId}) => {
    const sheetPath = excelFile.path;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(sheetPath);
    const worksheet = workbook.worksheets[0];

    const headers = worksheet.getRow(1).values.slice(1); // ignore first undefined
    const rows = [];

    const identitySet = new Set();
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const values = row.values.slice(1); // 1-based index
        const rowObj = Object.fromEntries(
            headers.map((h, i) => [h, values[i] || ""]),
        );
        identitySet.add(rowObj.identity);
        rows.push(rowObj);
    });

    const fetchedIdentities = await productService.getProductIdentities({
        payload: {ids: [...identitySet]},
    });

    const identityMap = new Map(
        fetchedIdentities.map((i) => [i.identityNo, i.id]),
    );

    const warranties = [];
    for (const row of rows) {
        const pid = identityMap.get(row.identity);
        if (!pid) continue;

        const {
            identity,
            start,
            end,
            authenticity,
            warranty_conditions,
            void_conditions,
            support_contact,
            usage_advice,
        } = row;
        warranties.push({
            productIdentitiesId: pid,
            warrantyStartDate: new Date(start),
            warrantyExpirationDate: new Date(end),
            authenticityConfirmation: authenticity,
            warrantyConditions: warranty_conditions,
            voidConditions: void_conditions,
            supportContact: support_contact,
            usageAdvice: usage_advice,
        });
    }
    let savedWarranties = [];
    if (warranties.length) {
        savedWarranties = await sql`
            insert into product_warranties ${sql(warranties)} returning *`;
    }
    return {insertCount: savedWarranties.length};
};

exports.bulkImportProduct = async ({zipFile, userId}) => {
    const currTime = Date.now();
    const extractTo = path.join(PUBLIC_DIR, "tmp", uuidv4());
    await fs.mkdir(extractTo, {recursive: true});

    // Extract ZIP
    await fsSync
        .createReadStream(zipFile.path)
        .pipe(unzipper.Extract({path: extractTo}))
        .promise();

    const folderPrefixMap = {
        "product-images": "productImages",
        "product-certificates": "productCertificates",
        "product-manuals": "productManuals",
    };

    for (const [folderName, prefix] of Object.entries(folderPrefixMap)) {
        const source = path.join(extractTo, folderName);
        const target = path.join(PUBLIC_DIR, folderName);
        try {
            const files = await fs.readdir(source);
            for (const file of files) {
                const ext = path.extname(file);
                const baseFilename = path.basename(file, ext);
                const newFileName = generateImportedFileName({
                    prefix,
                    currTime,
                    userId,
                    baseFilename,
                    ext,
                });
                await fs.copyFile(
                    path.join(source, file),
                    path.join(target, newFileName),
                );
            }
        } catch {
            /* folder may not exist — skip */
        }
    }

    // Parse Excel using ExcelJS
    const sheetPath = path.join(extractTo, "products.xlsx");
    const workbook = new ExcelJS.Workbook();

    try {
        await workbook.xlsx.readFile(sheetPath);
    } catch (err) {
        throw new Error("Invalid Zip file structure. Please follow import instructions!");
    }
    const worksheet = workbook.worksheets[0];

    const headers = worksheet.getRow(1).values.slice(1); // ignore first undefined
    const rows = [];

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const values = row.values.slice(1); // 1-based index
        const rowObj = Object.fromEntries(
            headers.map((h, i) => [h, values[i] || ""]),
        );
        rows.push(rowObj);
    });

    const now = new Date().toISOString();
    const productValues = [];
    const identityValues = [];
    const imageValues = [];
    const fileValues = [];

    for (const row of rows) {
        const {
            name,
            description,
            price,
            identities,
            images,
            manuals,
            certificates,
        } = row;

        const identityList = (identities || "")
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean);

        if (!identityList.length) continue;

        const existingRows = await productService.getProductIdentities({
            payload: {ids: identityList},
        });

        const existingIdentityNos = new Set(existingRows.map((r) => r.identityNo));
        const newIdentityNos = identityList.filter(
            (id) => !existingIdentityNos.has(id),
        );
        if (!newIdentityNos.length) continue;

        const productUuid = uuidv4();
        productValues.push({
            uuid: productUuid,
            name,
            description,
            price: parseFloat(price || 0),
            userId,
            createdAt: now,
            availableStock: newIdentityNos.length,
        });

        for (const id of newIdentityNos) {
            identityValues.push({
                uuid: uuidv4(),
                identityNo: id,
                identityType: 10,
                isAvailable: true,
                createdAt: now,
                productUuid,
            });
        }

        (images || "")
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean)
            .forEach((f, i) => {
                imageValues.push({
                    filename: generateImportedFileName({
                        prefix: "productImages",
                        currTime,
                        userId,
                        baseFilename: f,
                    }),
                    sortOrder: i + 1,
                    productUuid,
                });
            });

        (certificates || "")
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean)
            .forEach((f) => {
                fileValues.push({
                    filename: generateImportedFileName({
                        prefix: "productCertificates",
                        currTime,
                        userId,
                        baseFilename: f,
                    }),
                    fileType: 10,
                    productUuid,
                });
            });

        (manuals || "")
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean)
            .forEach((f) => {
                fileValues.push({
                    filename: generateImportedFileName({
                        prefix: "productManuals",
                        currTime,
                        userId,
                        baseFilename: f,
                    }),
                    fileType: 11,
                    productUuid,
                });
            });
    }

    let savedProducts = [];
    if (productValues.length) {
        savedProducts = await sql`
            insert into products ${sql(productValues)} returning *`;
    }

    const uuidToId = Object.fromEntries(savedProducts.map((p) => [p.uuid, p.id]));

    const identitiesFinal = identityValues.map((i) => ({
        uuid: i.uuid,
        identityNo: i.identityNo,
        identityType: i.identityType,
        isAvailable: i.isAvailable,
        createdAt: i.createdAt,
        productId: uuidToId[i.productUuid],
    }));
    if (identitiesFinal.length) {
        await sql`insert into product_identities ${sql(identitiesFinal)}`;
    }

    const imagesFinal = imageValues.map((i) => ({
        filename: i.filename,
        sortOrder: i.sortOrder,
        productId: uuidToId[i.productUuid],
    }));
    if (imagesFinal.length) {
        await sql`insert into product_images ${sql(imagesFinal)}`;
    }

    const filesFinal = fileValues.map((f) => ({
        filename: f.filename,
        fileType: f.fileType,
        productId: uuidToId[f.productUuid],
    }));
    if (filesFinal.length) {
        await sql`insert into product_files ${sql(filesFinal)}`;
    }

    await fs.rm(extractTo, {recursive: true, force: true});
    await fs.unlink(zipFile.path);

    return {insertCount: savedProducts.length};
};

exports.bulkExport = async ({userId, writable}) => {
    const products = await sql`
        SELECT p.id,
               p.uuid,
               p.name,
               p.description,
               p.price,
               COALESCE(array_agg(distinct pi.filename) FILTER(WHERE pi.filename IS NOT NULL), '{}')                        AS images,
               COALESCE(array_agg(distinct pf.filename || '|' || pf.file_type) FILTER(WHERE pf.filename IS NOT NULL), '{}') AS files,
               COALESCE(array_agg(distinct id.identity_no || '::' || id.id) FILTER(WHERE id.id IS NOT NULL), '{}')          AS identities
        FROM products p
                 LEFT JOIN product_images pi ON pi.product_id = p.id
                 LEFT JOIN product_files pf ON pf.product_id = p.id
                 LEFT JOIN product_identities id ON id.product_id = p.id
        WHERE p.user_id = ${userId}
        GROUP BY p.id;`;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Products");
    sheet.columns = [
        {header: "ID", key: "id", width: 25},
        {header: "Name", key: "name", width: 25},
        {header: "Description", key: "description", width: 40},
        {header: "Price", key: "price", width: 10},
        {header: "Product QR", key: "product_qr", width: 40},
        {header: "Serial", key: "serial", width: 20},
        {header: "Identity QR", key: "identity_qr", width: 40},
        {header: "Images", key: "images", width: 30},
        {header: "Manuals", key: "manuals", width: 30},
        {header: "Certificates", key: "certificates", width: 30},
    ];

    const fileCollection = {
        "product-images": new Set(),
        "product-manuals": new Set(),
        "product-certificates": new Set(),
    };

    for (const p of products) {
        const imageList = p.images || [];
        const fileList = p.files || [];

        const manuals = fileList
            .filter((f) => f.endsWith("|11"))
            .map((f) => f.split("|")[0]);

        const certificates = fileList
            .filter((f) => f.endsWith("|10"))
            .map((f) => f.split("|")[0]);

        imageList.forEach((img) => fileCollection["product-images"].add(img));
        manuals.forEach((m) => fileCollection["product-manuals"].add(m));
        certificates.forEach((c) => fileCollection["product-certificates"].add(c));

        // QR paths
        const modelDir = path.join(QR_BASE, String(p.id));
        const unitDir = path.join(modelDir, "unit");
        const modelQrPath = path.join(modelDir, "model.png");

        // Ensure dirs
        fsSync.mkdirSync(unitDir, {recursive: true});

        const productQrUrl = `${VUE_BASE_URL}/products/${p.id}?uuid=${p.uuid}&scanned=1`;

        // Generate product QR if missing
        if (!fsSync.existsSync(modelQrPath)) {
            const dataUrl = await QRCode.toDataURL(productQrUrl);
            const buffer = Buffer.from(dataUrl.split(",")[1], "base64");
            fsSync.writeFileSync(modelQrPath, buffer);
        }

        const productRow = sheet.addRow({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            product_qr: productQrUrl,
            images: imageList.join(", "),
            manuals: manuals.join(", "),
            certificates: certificates.join(", "),
        });

        for (const identityRaw of p.identities || []) {
            const [serial, identityId] = identityRaw.split("::");
            const unitQrPath = path.join(unitDir, `${identityId}.png`);
            const identityQrUrl = `${VUE_BASE_URL}/products/${p.id}/${identityId}?uuid=${p.uuid}&scanned=1`;

            if (!fsSync.existsSync(unitQrPath)) {
                const identityQrDataUrl = await QRCode.toDataURL(identityQrUrl);
                const buffer = Buffer.from(identityQrDataUrl.split(",")[1], "base64");
                fsSync.writeFileSync(unitQrPath, buffer);
            }

            sheet.addRow({
                serial,
                identity_qr: identityQrUrl,
            });
        }
    }

    // Save workbook to temp buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Create ZIP
    const archiveStream = new PassThrough();
    const archive = archiver("zip", {zlib: {level: 9}});

    archive.pipe(writable);

    // Add Excel to ZIP (this part should still be active)
    archive.append(excelBuffer, {name: "products.xlsx"});

    // Add files to subfolders
    for (const [folder, files] of Object.entries(fileCollection)) {
        for (const filename of files) {
            const filePath = path.join(PUBLIC_DIR, folder, filename);
            if (fsSync.existsSync(filePath)) {
                archive.file(filePath, {name: `${folder}/${filename}`});
            }
        }
    }

    // Add QR images to zip
    if (fsSync.existsSync(QR_BASE)) {
        const modelDirs = fsSync.readdirSync(QR_BASE);

        for (const modelId of modelDirs) {
            const modelPath = path.join(QR_BASE, modelId);
            const modelQrPath = path.join(modelPath, "model.png");
            const unitDirPath = path.join(modelPath, "unit");

            // Add product model QR
            if (fsSync.existsSync(modelQrPath)) {
                archive.file(modelQrPath, {
                    name: path.join("qr", "model", `${modelId}.png`),
                });
            }

            // Add all unit QR codes
            if (fsSync.existsSync(unitDirPath)) {
                const unitFiles = fsSync.readdirSync(unitDirPath);
                for (const unitFile of unitFiles) {
                    const unitFilePath = path.join(unitDirPath, unitFile);
                    // const unitId = path.parse(unitFile).name; // in case you need it later
                    archive.file(unitFilePath, {
                        name: path.join("qr", "unit", unitFile),
                    });
                }
            }
        }
    }

    try {
        await archive.finalize();
        return archiveStream;
    } catch (error) {
        console.error("Error during bulk export process:", error);
        throw error;
    }
};
