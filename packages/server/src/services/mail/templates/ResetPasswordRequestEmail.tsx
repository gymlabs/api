import React from "react";

import { Ending, Greeting } from "./components";
import { Email } from "./Email";

export class ResetPasswordRequestEmail extends Email {
  constructor(
    private readonly customerName: string,
    private readonly token: string
  ) {
    super();
  }

  getSubject() {
    return "Dein GymLabs Passwort zurücksetzen";
  }

  getBody() {
    return (
      <>
        <Greeting name={this.customerName} />
        <p>
          <a href={`http://localhost:3000/reset-password?token=${this.token}`}>
            Passwort zurücksetzen
          </a>
        </p>
        <Ending />
      </>
    );
  }
}
