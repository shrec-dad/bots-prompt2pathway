const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",   // SMTP server
  port: 587,                    // TLS port
  secure: false,                // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER, // your email
    pass: process.env.SMTP_PASS  // your email password or app password
  },
  tls: {
    rejectUnauthorized: false // allows self-signed certificates
  }
});

module.exports = transporter;
