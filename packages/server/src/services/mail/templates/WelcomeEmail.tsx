import React from "react";

import { Ending, Greeting } from "./components";
import { Email } from "./Email";

export class WelcomeEmail extends Email {
  constructor(
    private readonly customerName: string,
    private readonly emailVerificationToken: string
  ) {
    super();
  }

  getSubject() {
    return "Willkommen bei GymLabs!";
  }

  getBody() {
    return (
      <>
        <Greeting name={this.customerName} />
        <p>Willkommen bei GymLabs!</p>
        <p>Wir freuen uns, dass du dich für GymLabs entschieden hast.</p>
        <p>
          Bitte bestätige deine Email über den folgenden Link:
          <p>
            <a
              href={`http://localhost:3000/verify-email?token={${this.emailVerificationToken}}`}
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
