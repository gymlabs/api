import {
  createTestAccount,
  createTransport,
  getTestMessageUrl,
} from "nodemailer";
import { z, ZodError } from "zod";

import { Email } from "./templates/Email";
import { EmailUpdatedEmail } from "./templates/EmailUpdatedEmail";
import { ReactivationEmail } from "./templates/ReactivationEmail";
import { ResetPasswordRequestEmail } from "./templates/ResetPasswordRequestEmail";
import { WelcomeEmail } from "./templates/WelcomeEmail";
import { config } from "../../config";
import { InternalServerError, InvalidArgumentError } from "../../errors";
import { logger } from "../../logger";

export interface SendMailOptions {
  to: string;
  from?: string;
}

export async function sendMail(
  email: Email,
  { to, from = config.smtp.from }: SendMailOptions,
) {
  const subject = email.getSubject();
  const html = email.getHtml();
  const text = email.getText();

  if (config.nodeEnv === "development") {
    // TODO: replace this with private testing account
    const testAccount = await createTestAccount();

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

export const sendWelcomeEmail = async (
  to: string,
  name: string,
  token: string,
) => {
  try {
    try {
      z.object({
        to: z.string().email("Invalid email"),
        name: z.string().min(3, "Name must be at least 3 characters long"),
        token: z.string(),
      }).parse({ to, name, token });
    } catch (e) {
      if (e instanceof ZodError) {
        throw new InvalidArgumentError(e.message);
      }
      throw e;
    }
    await sendMail(new WelcomeEmail(name, token), { to });
    return true;
  } catch (e) {
    throw new InternalServerError();
  }
};

export const sendResetPasswordRequestEmail = async (
  to: string,
  name: string,
  token: string,
) => {
  try {
    try {
      z.object({
        to: z.string().email("Invalid email"),
        name: z.string().min(3, "Name must be at least 3 characters long"),

        token: z.string(),
      }).parse({ to, name, token });
    } catch (e) {
      if (e instanceof ZodError) {
        throw new InvalidArgumentError(e.message);
      }
      throw e;
    }
    await sendMail(new ResetPasswordRequestEmail(name, token), { to });
    return true;
  } catch (e) {
    throw new InternalServerError();
  }
};

export const sendEmailUpdateEmail = async (
  to: string,
  name: string,
  token: string,
) => {
  try {
    try {
      z.object({
        to: z.string().email("Invalid email"),
        name: z.string().min(3, "Name must be at least 3 characters long"),
        token: z.string(),
      }).parse({ to, name, token });
    } catch (e) {
      if (e instanceof ZodError) {
        throw new InvalidArgumentError(e.message);
      }
      throw e;
    }

    await sendMail(new EmailUpdatedEmail(name, token), { to });
    return true;
  } catch (e) {
    throw new InternalServerError();
  }
};

export const sendReactivationEmail = async (
  to: string,
  name: string,
  deletedAt: Date,
  token: string,
) => {
  try {
    try {
      z.object({
        to: z.string().email("Invalid email"),
        name: z.string().min(3, "Name must be at least 3 characters long"),
        deletedAt: z.date(),
        token: z.string(),
      }).parse({ to, name, deletedAt, token });
    } catch (e) {
      if (e instanceof ZodError) {
        throw new InvalidArgumentError(e.message);
      }
      throw e;
    }

    await sendMail(new ReactivationEmail(name, token, new Date(deletedAt)), {
      to,
    });
    return true;
  } catch (e) {
    throw new InternalServerError();
  }
};
