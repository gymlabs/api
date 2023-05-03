import { promisify } from "util";

import {
  TestAccount,
  createTestAccount,
  createTransport,
  getTestMessageUrl,
} from "nodemailer";

import { Email } from "./templates/Email";
import { config } from "../../config";
import { logger } from "../../logger";

export type SendMailOptions = {
  to: string;
  from?: string;
};

export async function sendMail(
  email: Email,
  { to, from = config.smtp.from }: SendMailOptions
) {
  const subject = email.getSubject();
  const html = email.getHtml();
  const text = email.getText();

  if (config.nodeEnv === "development") {
    // TODO: replace this with private testing account
    const getTestAccount = promisify<TestAccount>(createTestAccount);
    const testAccount = await getTestAccount();

    if (!testAccount) {
      throw new Error("Could not get test account");
    }

    createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    }).sendMail({ from, to, subject, text, html }, (err, info) => {
      if (err) {
        logger.warn("Error sending mock email", err);
      } else {
        logger.info("Preview mock email: %s", getTestMessageUrl(info));
      }
    });
  } else {
    await createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      auth: {
        user: config.smtp.auth.user,
        pass: config.smtp.auth.password,
      },
    }).sendMail({ from, to, subject, text, html });
  }
}
