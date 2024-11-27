const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // console.log(options);
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: "review@thetestingserver.com",
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || null,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

//  smtp updated on 23 feb 2024
