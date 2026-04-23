const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const normalizePhone = (phone = "") => {
  const digitsOnly = String(phone).replace(/\D/g, "");
  return digitsOnly ? `+${digitsOnly}` : "";
};

const isValidEmail = (email = "") => {
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

  return domainPart.split(".").every(
    (label) =>
      /^[a-z0-9-]+$/i.test(label) &&
      !label.startsWith("-") &&
      !label.endsWith("-")
  );
};

const isValidPhoneNumber = (phone = "") => /^\+[1-9]\d{9,14}$/.test(phone);

const validateRegistrationInput = ({ name = "", email = "", password = "", phone = "" }) => {
  if (String(name).trim().length < 2) {
    return "Enter your full name";
  }

  if (!isValidEmail(email)) {
    return "Enter a valid email address";
  }

  if (String(password).length < 8) {
    return "Password must be at least 8 characters long";
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must include at least one letter and one number";
  }

  if (!isValidPhoneNumber(phone)) {
    return "Enter a valid phone number with country code and at least 10 digits";
  }

  return null;
};

module.exports = {
  isValidEmail,
  isValidPhoneNumber,
  normalizeEmail,
  normalizePhone,
  validateRegistrationInput,
};
