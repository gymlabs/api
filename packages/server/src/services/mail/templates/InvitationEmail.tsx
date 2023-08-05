import * as React from "react";

import { Ending, Greeting } from "./components";
import { Email } from "./Email";

export class InvitationEmail extends Email {
  constructor(
    private readonly customerName: string,
    private readonly organizationName: string,
    private readonly invitationToken: string
  ) {
    super();
  }

  getSubject() {
    return "Du wurdest zu GymLabs eingeladen!";
  }

  getBody() {
    return (
      <>
        <Greeting name={this.customerName} />
        <p>Du wurdest zu GymLabs eingeladen!</p>
        <p>Du wurdest von {this.organizationName} zu GymLabs eingeladen.</p>
        <p>
          Erstelle jetzt dein Konto über den folgenden Link:
          <p>
            <a
              href={`http://localhost:3000/accept-invitation?token={${this.invitationToken}}`}
            >
              Konto erstellen
            </a>
          </p>
        </p>
        <Ending />
      </>
    );
  }
}
