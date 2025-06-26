const fs = require("fs").promises;
const path = require("path");
const qr = require("qrcode");
const { fileConfig } = require("./fileFields");
const { API_BASE_URL, VUE_BASE_URL, ANDROID_BASE_URL, LOCATIONIQ_API_KEY } =
  process.env;
const appInfo = { name: "Quthentic", version: 1.0 };

const excludedSecurityURLs = [
  "/product/getPublicProductNScan",
  "/product/getWarrantyWProductNScan",
];

const getCurrencySymbol = ({ code, type }) => {
  const codeLower = code.toString().toLowerCase();

  const currencyMap = {
    usd: { icon: "mdi-currency-usd", symbol: "$", code: "usd" },
    gbp: { icon: "mdi-currency-gbp", symbol: "£", code: "gbp" },
    eur: { icon: "mdi-currency-eur", symbol: "€", code: "eur" },
    thb: { icon: "mdi-currency-thb", symbol: "฿", code: "thb" },
  };

  const currencyData = currencyMap[codeLower];
  if (!currencyData) {
    return null; // Or undefined, or throw an error, depending on your desired behavior
  }
  if (type === undefined) {
    return currencyData;
  }
  return currencyData[type];
};

const defaultCurrency = getCurrencySymbol({ code: "thb" });

const formatDate = (inputDate) => {
  const date = new Date(inputDate);
  const day = `0${date.getDate()}`.slice(-2);
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const ifSudo = (role) => role === "sudo";

const removeOtherParams = (obj, allowedKeys) => {
  Object.keys(obj).forEach((key) => {
    if (!allowedKeys.includes(key)) {
      delete obj[key]; // Remove the key if it is not in allowedKeys
    }
  });
  return obj;
};

const moveImage = (sourcePath, destinationPath) => {
  return new Promise((resolve, reject) => {
    fs.rename(sourcePath, destinationPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const generateFilename = ({ prefix, ext }) => {
  return `${prefix || "file"}-${Date.now()}-${Math.round(Math.random() * 1e5)}${ext}`;
};

const generateImportedFileName = ({
  prefix,
  currTime,
  userId,
  baseFilename,
  ext,
}) => {
  let parts = [];

  if (prefix) parts.push(prefix);
  if (currTime) parts.push(currTime); // Expect currTime to be formatted (e.g., string or number)
  if (userId) parts.push(userId);
  if (baseFilename) parts.push(baseFilename);

  if (!ext) {
    return parts.join("-");
  }
  return `${parts.join("-")}${ext}`;
};

const getPrefix = (filename) => {
  return filename.split("-")[0];
};

const getFilePath = (filename, prefix) => {
  const calcPrefix = prefix || getPrefix(filename);
  return path.join(fileConfig[calcPrefix].dir, filename);
};

const removeFiles = async (fileArr) => {
  if (!Array.isArray(fileArr) || fileArr.length === 0) {
    return [];
  }

  const deletionResults = await Promise.all(
    fileArr.map(async ({ filename }) => {
      const filePath = getFilePath(filename);
      if (!filePath) {
        console.error("Invalid file path for file:", filename);
        return false;
      }

      try {
        await fs.unlink(filePath);
        return true;
      } catch (error) {
        console.error(`Failed to delete file: ${filePath}. Error:`, error);
        return false;
      }
    }),
  );

  return deletionResults;
};

const getLocationFromIP = async ({ ipAddress }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`http://ip-api.com/json/${ipAddress}`, {
      signal: controller.signal,
      headers: {
        "User-Agent": `${appInfo.name}/${appInfo.version} (dev@quthentic.com)`,
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn("IP-API error:", response.status, response);
      return {};
    }

    const data = await response.json();
    return {
      status: data.status,
      country: data.country,
      countryCode: data.countryCode,
      region: data.region,
      regionName: data.regionName,
      city: data.city,
      zip: data.zip,
      latitude: data.lat,
      longitude: data.lon,
      timezone: data.timezone,
      isp: data.isp,
      org: data.org,
      as: data.as,
      query: data.query,
    };
  } catch (error) {
    console.error("DEBUG IP-API fetch error:", error);
    console.warn("IP-API request failed:", error.message);
    return {};
  }
};

const getClientIP = (req) => {
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (xForwardedFor) {
    // Could be a list of IPs if there are multiple proxies
    return xForwardedFor.split(",")[0].trim();
  }
  return req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip;
};

const reverseGeocode = async ({ latitude, longitude }) => {
  if (!LOCATIONIQ_API_KEY) return {};

  const url = `https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 4 second timeout

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "User-Agent": `${appInfo.name}/${appInfo.version} (dev@quthentic.com)`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json();
    if (!response.ok) {
      console.warn("LocationIQ error:", data);
      return {}; // Fail silently
    }

    const address = data.address || {};
    return {
      latitude: data.lat,
      longitude: data.lon,
      displayName: data.display_name,
      attraction: address.attraction || "",
      houseNumber: address.house_number || "",
      road: address.road || "",
      neighbourhood: address.neighbourhood || "",
      suburb: address.suburb || "",
      city:
        address.city || address.town || address.village || address.hamlet || "",
      county: address.county || "",
      state: address.state || "",
      postcode: address.postcode || "",
      country: address.country || "",
      countryCode: address.country_code || "",
    };
  } catch (error) {
    console.warn("LocationIQ failed (timeout or network):", error.message);
    return {}; // Don't break the request
  }
};

const generateBase64QrCode = async (payload) => {
  const { productId, productIdentitiesId, uuid } = payload;
  if (!productId || !productIdentitiesId || !uuid) {
    return qr.toDataURL(payload);
  }
  const params = new URLSearchParams();
  params.append("uuid", uuid);
  params.append("scanned", 1);

  const route = `${VUE_BASE_URL}/products/${productId}/${productIdentitiesId}?${params.toString()}`;

  return qr.toDataURL(route); // return with base64 prefix
};

const generateQrCodeContent = async ({
  productId,
  productIdentitiesId,
  uuid,
}) => {
  const qrCodeDataUrl = await generateBase64QrCode({
    productId,
    productIdentitiesId,
    uuid,
  });
  return qrCodeDataUrl.split(",")[1]; // return only base64 portion
};

// const logoSvgString = fsSync.readFileSync(
//   path.join(__dirname, "./logo.svg"),
//   "utf8"
// );

module.exports = {
  API_BASE_URL,
  VUE_BASE_URL,
  ANDROID_BASE_URL,
  excludedSecurityURLs,
  appInfo,
  defaultCurrency,
  getCurrencySymbol,
  moveImage,
  getPrefix,
  generateFilename,
  generateImportedFileName,
  generateBase64QrCode,
  generateQrCodeContent,
  getFilePath,
  removeFiles,
  formatDate,
  removeOtherParams,
  ifSudo,
  getClientIP,
  getLocationFromIP,
  reverseGeocode,
};
