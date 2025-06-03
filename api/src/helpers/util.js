const fs = require("fs").promises;
const path = require("path");
const { fileConfig } = require("./fileFields");
const { API_BASE_URL, VUE_BASE_URL, ANDROID_BASE_URL, LOCATIONIQ_API_KEY } =
  process.env;

const appInfo = { name: "QuickStarter", version: 1.0 };

const excludedSecurityURLs = [
  "/product/getPublicProductNScan",
  "/product/getWarrantyNScan",
];

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

const emailFooter = `   
    <br>
    <p>Best wishes,<br>
    The <strong>${appInfo.name}</strong> Team</p>`;

const generatePassResetContent = (token) => {
  return `
    <p>Greetings!</p>

    <p>We received a request to reset your password. To proceed, please click the button below. This link will be valid for the next 1 hour:</p>

    <p><a href="${VUE_BASE_URL}/reset-password/?token=${token}">
      <button style="background-color: #e40046; color: white; border: none; padding: 10px;">Reset Password</button>
    </a></p>

    <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>

    ${emailFooter}
  `;
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
  console.log(99, deletionResults);

  return deletionResults;
};

const getCurrencySymbol = (currencyCode, type) => {
  const currencyCodeLower = currencyCode.toString().toLowerCase();

  const currencyMap = {
    usd: { icon: "mdi-currency-usd", symbol: "$" },
    gbp: { icon: "mdi-currency-gbp", symbol: "£" },
    eur: { icon: "mdi-currency-eur", symbol: "€" },
  };

  return currencyMap[currencyCodeLower][type];
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

// const generateQrCode = async (data) => await qr.toDataURL(data);
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
  getCurrencySymbol,
  generatePassResetContent,
  moveImage,
  getPrefix,
  generateFilename,
  getFilePath,
  removeFiles,
  formatDate,
  removeOtherParams,
  ifSudo,
  getClientIP,
  reverseGeocode,
};
