const nodemailer = require("nodemailer");
require("dotenv").config();

const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASSWORD,
  },
});

function sendEmail(message) {
  message.from = "1venya1love@getMaxListeners.com";

  return transport.sendMail(message);
}

module.exports = { sendEmail };