import { toast } from "vue-sonner";
import { countries } from "@/others/country-list";

export const appInfo = { name: "QuickStarter", version: 1.0 };
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

export const getClientPublicImgUrl = (imageName) =>
  imageName ? `/img/${imageName}` : null;

export const getApiPublicImgUrl = (imageName, type) =>
  isProd
    ? `${apiBaseUrl}/api/${type}/${imageName}`
    : `${apiBaseUrl}/${type}/${imageName}`;

export const getUserImageUrl = (imageName) => {
  return imageName === "null" || !imageName
    ? getClientPublicImgUrl("default-user.jpg")
    : getApiPublicImgUrl(imageName, "user");
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

export const getQueryParam = (param) => {
  const queryParams = new URLSearchParams(window.location.search);
  return queryParams.get(param);
};

export const removeQueryParams = (url, paramsToRemove) => {
  const parsedUrl = new URL(url);

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

export const showApiQueryMsg = (color = "blue") => {
  if (localStorage.hasOwnProperty("apiQueryMsg")) {
    toast(localStorage.getItem("apiQueryMsg"), {
      cardProps: { color },
      action: {
        label: "Close",
        buttonProps: {
          color: "white",
        },
        onClick() {},
      },
    });
    localStorage.removeItem("apiQueryMsg");
  }
};

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

export const getCurrencySymbol = (currencyCode, type) => {
  const currencyCodeLower = currencyCode.toString().toLowerCase();

  const currencyMap = {
    usd: { icon: "mdi-currency-usd", symbol: "$" },
    gbp: { icon: "mdi-currency-gbp", symbol: "£" },
    eur: { icon: "mdi-currency-eur", symbol: "€" },
  };

  return currencyMap[currencyCodeLower][type];
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
