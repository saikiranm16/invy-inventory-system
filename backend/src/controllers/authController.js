const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const generateToken = require("../utils/generateToken");
const {
  createCaptchaChallenge,
  verifyCaptchaChallenge,
} = require("../utils/captchaStore");
const {
  isValidEmail,
  normalizeEmail,
  normalizePhone,
  validateRegistrationInput,
} = require("../utils/authValidation");

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

const LOGIN_LOCK_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_WINDOW_MS = 15 * 60 * 1000;

const buildAuthResponse = (user) => ({
  message: "Success",
  token: generateToken(user._id, user.role),
  user: serializeUser(user),
});

const registerFailedLoginAttempt = async (user) => {
  user.failedLoginAttempts = Number(user.failedLoginAttempts || 0) + 1;

  if (user.failedLoginAttempts >= LOGIN_LOCK_MAX_ATTEMPTS) {
    user.lockUntil = new Date(Date.now() + LOGIN_LOCK_WINDOW_MS);
    user.failedLoginAttempts = 0;
  }

  await user.save();
};

const clearFailedLoginAttemptState = async (user) => {
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  user.lastLoginAt = new Date();
  await user.save();
};

const buildGooglePhonePlaceholder = (subject = "") => {
  const digits = String(subject).replace(/\D/g, "").slice(-9).padStart(9, "0");
  return `+999${digits}`;
};

const validateCaptchaOrReject = (req, res) => {
  const isCaptchaValid = verifyCaptchaChallenge(
    req.body.captchaId,
    req.body.captchaAnswer
  );

  if (!isCaptchaValid) {
    res.status(400).json({ message: "Captcha verification failed" });
    return false;
  }

  return true;
};

exports.getCaptcha = (req, res) => {
  res.json(createCaptchaChallenge());
};

exports.register = async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");
  const phone = normalizePhone(req.body.phone);
  const validationError = validateRegistrationInput({
    name,
    email,
    password,
    phone,
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "user",
    });

    res.status(201).json({
      ...buildAuthResponse(user),
      message: "User registered",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({
        message:
          Object.values(err.errors)[0]?.message || "Enter valid registration details",
      });
    }

    console.error("Register error:", err);
    res.status(500).json({ message: "Unable to register right now" });
  }
};

exports.login = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email address" });
  }

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  if (!validateCaptchaOrReject(req, res)) {
    return;
  }

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      const waitMinutes = Math.max(
        1,
        Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000)
      );

      return res.status(423).json({
        message: `Account temporarily locked. Try again in ${waitMinutes} minute(s).`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      await registerFailedLoginAttempt(user);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    await clearFailedLoginAttemptState(user);

    res.json({
      ...buildAuthResponse(user),
      message: "Login successful",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Unable to login right now" });
  }
};

exports.googleSignIn = async (req, res) => {
  const credential = String(req.body.credential || "").trim();
  const googleClientId =
    process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    return res
      .status(503)
      .json({ message: "Google sign-in is not configured on this server" });
  }

  if (!credential) {
    return res.status(400).json({ message: "Google credential is required" });
  }

  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
        credential
      )}`
    );
    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({ message: "Invalid Google sign-in token" });
    }

    if (data.aud !== googleClientId) {
      return res.status(400).json({ message: "Google client mismatch" });
    }

    if (data.email_verified !== "true" || !isValidEmail(data.email)) {
      return res
        .status(400)
        .json({ message: "Google account email could not be verified" });
    }

    const email = normalizeEmail(data.email);
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: String(data.name || email.split("@")[0]).trim(),
        email,
        phone: buildGooglePhonePlaceholder(data.sub),
        password: await bcrypt.hash(crypto.randomUUID(), 10),
        role: "user",
      });
    }

    res.json({
      ...buildAuthResponse(user),
      message: "Google sign-in successful",
    });
  } catch (err) {
    console.error("Google sign-in error:", err);
    res.status(500).json({ message: "Unable to sign in with Google right now" });
  }
};

exports.updateProfile = async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email);
  const phone = normalizePhone(req.body.phone);
  const validationError = validateRegistrationInput({
    name,
    email,
    password: "Password1",
    phone,
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.user.id },
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Another account already uses this email" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        email,
        phone,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated",
      user: serializeUser(user),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Another account already uses this email" });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({
        message:
          Object.values(err.errors)[0]?.message || "Enter valid profile details",
      });
    }

    console.error("Update profile error:", err);
    res.status(500).json({ message: "Unable to update profile right now" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile loaded",
      user: serializeUser(user),
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Unable to load profile right now" });
  }
};
