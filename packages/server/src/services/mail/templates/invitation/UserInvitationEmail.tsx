import * as React from "react";

import { Ending } from "../components";
import { Email } from "../Email";

export class UserInvitationEmail extends Email {
  constructor(
    private readonly inviter: string,
    private readonly invitationToken: string,
  ) {
    super();
  }

  getSubject() {
    return "Du wurdest zu GymLabs eingeladen!";
  }

  getBody() {
    return (
      <>
        <p>Du wurdest zu GymLabs eingeladen!</p>
        <p>Du wurdest von {this.inviter} zu GymLabs eingeladen.</p>
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
