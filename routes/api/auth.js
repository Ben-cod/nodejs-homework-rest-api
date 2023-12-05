const express = require("express");
const { validateBody } = require("../../validation/validateBody");
const {
  registerSchema,
  loginSchema,
  emailSchema,
} = require("../../validation/userValidationSchemas");
const {
  register,
  login,
  getCurrent,
  logout,
  updateAvatar,
  verify,
  resendVerificationEmail,
} = require("../../controllers/auth");
const { authenticate } = require("../../middleware/autenticate");
const { upload } = require("../../middleware/uploadFile");

const router = express.Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/logout", authenticate, logout);
router.get("/current", authenticate, getCurrent);
router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  updateAvatar
);
router.get("/verify/:verificationToken", verify);
router.post(
  "/verify",
  validateBody(emailSchema),
  resendVerificationEmail
);
module.exports = router;
