import nodemailer from "nodemailer";

import { config } from "~/config";

export const smtpTransporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  auth: {
    user: config.smtp.auth.user,
    pass: config.smtp.auth.password,
  },
});
