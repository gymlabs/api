import React from "react";

import { Ending, Greeting } from "./components";
import { Email } from "./Email";

export class EmailUpdatedEmail extends Email {
  constructor(
    private readonly customerName: string,
    private readonly emailVerificationToken: string
  ) {
    super();
  }

  getSubject() {
    return "Bitte bestätige deine Email";
  }

  getBody() {
    return (
      <>
        <Greeting name={this.customerName} />
        <p>
          bitte bestätige deine neue Email über den folgenden Link:
          <p>
            <a
              href={`http://localhost:3000/verify-email?token=${this.emailVerificationToken}`}
            >
              Email jetzt bestätigen
            </a>
          </p>
        </p>
        <Ending />
      </>
    );
  }
}
