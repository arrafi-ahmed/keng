import { countries } from "@/others/country-list";
import store from "@/store/index.js";

export const appInfo = { name: "Quthentic", version: 1.0 };
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
export const clientBaseUrl = import.meta.env.VITE_BASE_URL;
export const isProd = import.meta.env.PROD;

export const getSlug = (slug) =>
  slug
    .trim()
    .toLowerCase() // Convert to lowercase
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, "");

export const formatDate = (inputDate) => {
  if (!inputDate) return "";
  const parsedDate = new Date(inputDate);
  if (!parsedDate.getTime()) return "";

  const day = `0${parsedDate.getDate()}`.slice(-2);
  const month = `0${parsedDate.getMonth() + 1}`.slice(-2);
  const year = parsedDate.getFullYear();
  return `${day}/${month}/${year}`;
};

export const getDateOnly = (inputDate) => {
  // YYYY-MM-DD format
  if (!inputDate) return "";
  return new Date(inputDate).toLocaleDateString("en-CA");
};

export const getTimeOnly = (inputDate) => {
  if (!inputDate) return "";

  const date = new Date(inputDate);
  let hours = date.getHours().toString().padStart(2, "0"); // Ensures two digits
  let minutes = date.getMinutes().toString().padStart(2, "0"); // Ensures two digits

  return `${hours}:${minutes}`;
};

export const sendToWhatsapp = (phone, message) => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappShareLink = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
  window.open(whatsappShareLink, "_blank");
};

// get iso datetime offset with timezone
export const toLocalISOString = (inputDate) => {
  const date = new Date(inputDate);
  const tzoffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  const localISOTime = new Date(date - tzoffset).toISOString().slice(0, -1);
  return localISOTime;
};

export const formatDateTime = (inputDateTime) => {
  const formattedDate = formatDate(inputDateTime);
  const date = new Date(inputDateTime);
  const hours = `0${date.getHours()}`.slice(-2);
  const minutes = `0${date.getMinutes()}`.slice(-2);
  // const seconds = `0${date.getSeconds()}`.slice(-2);
  return `${formattedDate} ${hours}:${minutes}`;
};

export const getClientPublicImageUrl = (imageName) =>
  imageName ? `/img/${imageName}` : null;

export const getApiPublicFileUrl = (fileName, filePrefix) =>
  isProd
    ? `${apiBaseUrl}/api/${filePrefix}/${fileName}`
    : `${apiBaseUrl}/${filePrefix}/${fileName}`;

export const getUserImageUrl = (imageName) => {
  return imageName === "null" || !imageName
    ? getClientPublicImageUrl("default-user.jpg")
    : getApiPublicFileUrl(imageName, "user");
};

export const getProductImageUrl = (imageName) => {
  return imageName === "null" || !imageName
    ? getClientPublicImageUrl("default-user.jpg")
    : getApiPublicFileUrl(imageName, "product-images");
};

export const removeNullProperties = (obj) => {
  for (const key in obj) {
    if (obj[key] === null) delete obj[key];
  }
  return obj;
};

export const getToLink = (item) => {
  if (item.to.params) {
    const paramKey = Object.keys(item.to.params)[0];
    const paramVal = item.to.params[paramKey];
    return {
      name: item.to.name,
      params: { [paramKey]: paramVal },
    };
  }
  return item.to;
};

export const showApiQueryMsg = () => {
  if (localStorage.hasOwnProperty("apiQueryMsg")) {
    store.commit("addSnackbar", {
      text: localStorage.getItem("apiQueryMsg"),
    });
    localStorage.removeItem("apiQueryMsg");
  }
};

export const getQueryParam = ({ param }) => {
  const queryParams = new URLSearchParams(window.location.search);
  return queryParams.get(param);
};

export const removeQueryParams = ({ paramsToRemove }) => {
  const parsedUrl = new URL(window.location.href);

  // Create a URLSearchParams object from the URL's search parameters
  const searchParams = new URLSearchParams(parsedUrl.search);

  // Remove the specified query parameters
  paramsToRemove.forEach((param) => {
    searchParams.delete(param);
  });

  // Construct the new URL with the updated search parameters
  parsedUrl.search = searchParams.toString();

  // Return the updated URL as a string
  return parsedUrl.toString();
};

export const handleRedirect = ({ param, hardRedirect = true }) => {
  const paramValue = getQueryParam({ param });
  if (paramValue) {
    let newUrl = paramValue;

    if (hardRedirect) window.location.replace(newUrl);
    else window.history.replaceState({}, document.title, newUrl); // Corrected: Use .replace() as a method
    return true; // Indicates a redirect happened
  }
  return false;
};

export const handleRemoveQueriesNRedirect = ({
  params = [], // Array of param names to check/remove
  saveToLocalStorage = true,
  hardRedirect = true,
}) => {
  let found = false;
  let queryParamsToRemove = [];

  params.forEach((paramName) => {
    const paramValue = getQueryParam({ param: paramName });

    if (paramValue) {
      found = true;
      queryParamsToRemove.push(paramName);

      if (saveToLocalStorage) {
        localStorage.setItem(paramName, paramValue);
      }
    }
  });

  if (found) {
    const newUrl = removeQueryParams({ paramsToRemove: queryParamsToRemove });

    if (hardRedirect) {
      window.location.replace(newUrl);
    } else {
      window.history.replaceState({}, document.title, newUrl);
    }
    return true;
  }
  return false;
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidImage = (file) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  return allowedTypes.includes(file.type);
};

export const isValidPass = [
  (v) => !!v || "Password is required!",
  (v) => v.length >= 8 || "Password must be 8 or more characters!",
  (v) => /\d/.test(v) || "Password must include at least one number!",
];

export const input_fields = [
  { id: 0, title: "Short answer" },
  { id: 1, title: "Paragraph" },
  { id: 2, title: "Multiple choice" },
  { id: 3, title: "Checkboxes" },
  { id: 4, title: "Dropdown" },
];

export const getCountryList = (filterName) => {
  if (filterName === "all") return countries;
  return countries.map((item) => item[filterName]);
};

export const getCurrencySymbol = ({ code, type }) => {
  const codeLower = code.toString().toLowerCase();
  const currencyMap = {
    usd: { icon: "mdi-currency-usd", symbol: "$", value: "usd" },
    gbp: { icon: "mdi-currency-gbp", symbol: "£", value: "gbp" },
    eur: { icon: "mdi-currency-eur", symbol: "€", value: "eur" },
    thb: { icon: "mdi-currency-thb", symbol: "฿", value: "thb" },
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

export const defaultCurrency = getCurrencySymbol({ code: "thb" });

export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy, // Accuracy in meters
            timestamp: position.timestamp, // Timestamp of the reading
          });
        },
        (error) => {
          // Handle various error codes
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error("User denied the request for Geolocation."));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error("Location information is unavailable."));
              break;
            case error.TIMEOUT:
              reject(new Error("The request to get user location timed out."));
              break;
            case error.UNKNOWN_ERROR:
            default:
              reject(new Error("An unknown error occurred getting location."));
              break;
          }
        },
        {
          // Optional: Geolocation options
          enableHighAccuracy: true, // Try to get the best possible result
          timeout: 5000, // Maximum time (ms) to wait for a position
          maximumAge: 0, // Don't use a cached position
        },
      );
    } else {
      reject(new Error("Geolocation is not supported by this browser."));
    }
  });
};

export const downloadFile = async (apiEndpoint) => {
  try {
    const response = await $axios.get(apiEndpoint, {
      responseType: "blob",
    });
    const blob = response.data;

    // Extract filename from Content-Disposition header if available
    // Example: 'attachment; filename="my_document.pdf"'
    let filename = `download-${new Date().toISOString()}`; // Default filename
    const contentDisposition = response.headers["content-disposition"];

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    // Create a temporary URL for the Blob object
    const url = window.URL.createObjectURL(blob);

    // Create a temporary <a> element
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename); // Set the desired filename for the download

    // Append the link to the document body, programmatically click it, and then remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke the temporary URL to free up memory
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading file:", error);
  }
};

// disable-horizontal-scrolling start
let touchStartX = 0;
let touchStartY = 0;
export const preventDrawerSwipe = (event) => {
  if (typeof window === "undefined") return; // Prevent execution on the server

  const touch = event.touches[0];
  if (event.type === "touchstart") {
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  } else if (event.type === "touchmove") {
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;
    const deltaX = touchStartX - touchEndX;
    const deltaY = Math.abs(touchStartY - touchEndY);

    const isHorizontalSwipe = deltaY < deltaX;
    const drawerOpenGesture = isHorizontalSwipe && deltaX > 8;

    if (drawerOpenGesture) {
      const target = event.target.closest(".no-block-swipe");
      if (!target) {
        event.preventDefault();
      }
    }
  }
};

export const addSwipeBlocking = () => {
  if (typeof window !== "undefined") {
    window.addEventListener("touchstart", preventDrawerSwipe, {
      passive: false,
    });
    window.addEventListener("touchmove", preventDrawerSwipe, {
      passive: false,
    });
  }
};
export const removeSwipeBlocking = () => {
  if (typeof window !== "undefined") {
    window.removeEventListener("touchstart", preventDrawerSwipe);
    window.removeEventListener("touchmove", preventDrawerSwipe);
  }
};
// disable-horizontal-scrolling  end
