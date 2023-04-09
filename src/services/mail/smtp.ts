import { createTransport } from "nodemailer";

import { config } from "~/config";

export const smtpTransporter = createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  auth: {
    user: config.smtp.auth.user,
    pass: config.smtp.auth.password,
  },
});
