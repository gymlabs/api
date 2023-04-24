import { Transporter } from "nodemailer";

import { smtpTransporter } from "./smtp";
import { Email } from "./templates/Email";
import { config } from "../../config";
import { logger } from "../../logger";

export type SendMailOptions = {
  to: string;
  from?: string;
  transport?: Transporter;
};

export async function sendMail(
  email: Email,
  { to, from = config.smtp.from, transport = smtpTransporter }: SendMailOptions
) {
  const subject = email.getSubject();
  const html = email.getHtml();
  const text = email.getText();

  if (config.nodeEnv === "production") {
    await transport.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  } else {
    logger.warn(
      {
        from,
        to,
        subject,
        text,
        html,
      },
      "Logging email instead of sending it because the server is running in a non-production environment"
    );
  }
}
