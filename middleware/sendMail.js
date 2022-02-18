import nodemailer from "nodemailer";

const forMailUser = process.env.GMAIL_USER;
const forMailPass = process.env.GMAIL_PASS;
const fromUser = process.env.FROM;
const userSubject = process.env.SUBJECT;

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: forMailUser,
    pass: forMailPass,
  },
});

export default {
  sendEmail(from, to, subject, html) {
    return new Promise((resolve, reject) => {
      transport.sendMail(
        { from: fromUser, subject: userSubject, to, html },
        (err, info) => {
          if (err) reject(err);
          resolve(info);
        }
      );
    });
  },
};
