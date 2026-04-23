const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  register,
  login,
  googleSignIn,
  getCaptcha,
  getProfile,
  updateProfile,
} = require("../controllers/authController");

router.get("/captcha", getCaptcha);
router.get("/profile", protect, getProfile);
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleSignIn);
router.put("/profile", protect, updateProfile);

module.exports = router;
