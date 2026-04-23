export const COUNTRY_CODE_OPTIONS = [
  { value: "+91", label: "India (+91)" },
  { value: "+1", label: "United States (+1)" },
  { value: "+44", label: "United Kingdom (+44)" },
  { value: "+61", label: "Australia (+61)" },
  { value: "+971", label: "UAE (+971)" },
];

export const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

export const sanitizePhoneNumberInput = (value = "") =>
  String(value).replace(/\D/g, "").slice(0, 14);

export const buildPhoneNumber = (countryCode = "", phoneNumber = "") =>
  `${countryCode}${sanitizePhoneNumberInput(phoneNumber)}`;

export const splitPhoneNumber = (phone = "") => {
  const normalizedPhone = String(phone).replace(/\s+/g, "");

  const matchedOption = COUNTRY_CODE_OPTIONS.find((option) =>
    normalizedPhone.startsWith(option.value)
  );

  if (!matchedOption) {
    return {
      countryCode: COUNTRY_CODE_OPTIONS[0].value,
      phoneNumber: normalizedPhone.replace(/\D/g, ""),
    };
  }

  return {
    countryCode: matchedOption.value,
    phoneNumber: normalizedPhone.slice(matchedOption.value.length).replace(/\D/g, ""),
  };
};

export const isValidEmail = (email = "") => {
  const normalizedEmail = normalizeEmail(email);

  if (
    !normalizedEmail ||
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)
  ) {
    return false;
  }

  const [localPart, domainPart] = normalizedEmail.split("@");

  if (
    !localPart ||
    !domainPart ||
    localPart.length > 64 ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..") ||
    domainPart.includes("..")
  ) {
    return false;
  }

  const domainLabels = domainPart.split(".");

  return domainLabels.every(
    (label) =>
      /^[a-z0-9-]+$/i.test(label) &&
      !label.startsWith("-") &&
      !label.endsWith("-")
  );
};

export const isValidPhoneNumber = (phone = "") =>
  /^\+[1-9]\d{9,14}$/.test(String(phone).trim());

export const validateName = (name = "") => {
  const normalizedName = String(name).trim();

  if (normalizedName.length < 2) {
    return "Enter your full name.";
  }

  return null;
};

export const validatePassword = (password = "", isLogin = false) => {
  if (!password) {
    return "Password is required.";
  }

  if (isLogin) {
    return null;
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must include at least one letter and one number.";
  }

  return null;
};

export const validateEmail = (email = "") =>
  isValidEmail(email) ? null : "Enter a valid email address.";

export const validatePhone = (phone = "") =>
  isValidPhoneNumber(phone)
    ? null
    : "Enter a valid phone number with country code and at least 10 digits.";
