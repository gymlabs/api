import * as React from "react";

import { Ending } from "../components";
import { Email } from "../Email";

export class EmploymentInvitationEmail extends Email {
  constructor(
    private readonly gymName: string,
    private readonly invitationToken: string,
  ) {
    super();
  }

  getSubject() {
    return `Du wurdest zu ${this.gymName} eingeladen!`;
  }

  getBody() {
    return (
      <>
        <p>Starte jetzt als Angestellter bei {this.gymName} durch.</p>
        <p>
          Akzeptiere jetzt über den folgenden Link:
          <p>
            <a
              href={`http://localhost:3000/accept-invitation?token={${this.invitationToken}}`}
            >
              Jetzt durchstarten
            </a>
          </p>
        </p>
        <Ending />
      </>
    );
  }
}
