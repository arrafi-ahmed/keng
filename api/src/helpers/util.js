const fs = require("fs").promises;
const path = require("path");
const qr = require("qrcode");
const { fileConfig } = require("./fileFields");
const { API_BASE_URL, VUE_BASE_URL, ANDROID_BASE_URL, LOCATIONIQ_API_KEY } =
  process.env;
const appInfo = { name: "Quthentic", version: 1.0 };

const excludedSecurityURLs = [
  "/product/getPublicProductNScan",
  "/product/getWarrantyNScan",
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

const getClientIP = (req) => {
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (xForwardedFor) {
    // Could be a list of IPs if there are multiple proxies
    return xForwardedFor.split(",")[0].trim();
  }
  return req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip;
};

const reverseGeocode = async ({ latitude, longitude }) => {
  if (!LOCATIONIQ_API_KEY) {
    throw new Error(
      "LocationIQ API key is not configured in environment variables.",
    );
  }

  // LocationIQ's reverse geocoding endpoint
  const url = `https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "User-Agent": `${appInfo.name}/${appInfo.version} (doe@dev.com)`,
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json(); // Parse the JSON response

    if (!response.ok) {
      console.error("LocationIQ API error response:", data);
      throw new Error(
        data.error ||
          `Failed to retrieve location details: HTTP Status ${response.status}`,
      );
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
        address.city || address.town || address.village || address.hamlet || "", // Fallbacks for different settlement types
      county: address.county || "",
      state: address.state || "",
      postcode: address.postcode || "",
      country: address.country || "",
      countryCode: address.country_code || "",
    };
  } catch (error) {
    console.error(
      "Error fetching location details from LocationIQ:",
      error.message,
    );
    throw new Error(`Failed to get location name: ${error.message}`);
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

const generateQrCodeContent = async ({ productId, productIdentitiesId, uuid }) => {
  const qrCodeDataUrl = await generateBase64QrCode({productId, productIdentitiesId, uuid})
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
  reverseGeocode,
};
