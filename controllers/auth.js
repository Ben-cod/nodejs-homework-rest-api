const { HttpError } = require("../helpers/HttpError");
const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { SECRET_KEY, BASE_URL } = process.env;
const fs = require("fs/promises");
const gravatar = require("gravatar");
const path = require("path");
const crypto = require("crypto");
const Jimp = require("jimp");
const { sendEmail } = require("../helpers/sendEmail");

const avatarDir = path.join(__dirname, "../public/avatars");

const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      throw HttpError(409, "Email in use");
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravatar.url(email);
    const verificationToken = crypto.randomUUID();

    const verifyEmail = {
      to: email,
      subject: "verify email",
      html: `<a target="_blank" href="${BASE_URL}/users/verify/${verificationToken}">Confirm your email</a>`,
      text: `Confirm your email, please open the link http://localhost:8080/users/verify/${verificationToken}`,
    };
    await sendEmail(verifyEmail);

    const newUser = await User.create({
      ...req.body,
      password: hashPassword,
      avatarURL,
      verificationToken,
    });

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

const verify = async (req, res, next) => {
  const { verificationToken } = req.params;
  try {
    const user = await User.findOne({ verificationToken });
    if (!user) {
      throw HttpError(404, "User not found");
    }
    await User.findByIdAndUpdate(user._id, {
      verify: true,
      verificationToken: null,
    });
    res.status(200).json({ message: "Verification successful" });
  } catch (error) {
    next(error);
  }
};
const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = User.findOne({ email });
    if (!user) {
      throw HttpError(401, "Email not found");
    }
    if (user.verify) {
      throw HttpError(401, "Verification has already been passed");
    }
    const verifyEmail = {
      to: email,
      subject: "verify email",
      html: `<a target="_blank" href="${BASE_URL}/users/verify/${verificationToken}">Confirm your email</a>`,
      text: `Confirm your email, please open the link http://localhost:8080/users/verify/${verificationToken}`,
    };
    await sendEmail(verifyEmail);
    res.json({ message: "Verification email sent" });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw HttpError(401, "Email or password is wrong");
    }

    if (!user.verify) {
      throw HttpError(401, "Email or password is wrong");
    }
    const passwordCompare = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordCompare) {
      throw HttpError(401, "Email not verify");
    }
    const payload = {
      id: user._id,
    };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
    await User.findByIdAndUpdate(user._id, { token });
    res.json({
      token,
      user: { email: user.email, subscription: user.subscription },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { _id } = req.user;
    await User.findByIdAndUpdate(_id, { token: "" });
    res.status(204).json({ message: "No content" });
  } catch (error) {
    next(error);
  }
};

const getCurrent = async (req, res, next) => {
  try {
    const { email, subscription } = req.user;
    res.json({ email, subscription });
  } catch (error) {
    next(error);
  }
};

const updateAvatar = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { path: tempUpload, originalname } = req.file;

    const image = await Jimp.read(tempUpload);
    image.resize(250, 250);

    const fileName = `${_id}_${crypto.randomUUID()}_${originalname}`;

    const avatarUpload = path.join(avatarDir, fileName);

    await fs.rename(tempUpload, avatarUpload);

    const avatarURL = path.join("avatars", originalname);
    await User.findByIdAndUpdate(_id, { avatarURL });

    res.json({
      avatarURL,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrent,
  updateAvatar,
  verify,
  resendVerificationEmail,
};
