import * as React from "react";

import { Ending } from "../components";
import { Email } from "../Email";

export class MembershipInvitationEmail extends Email {
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
        <p>
          Du wurdest eingeladen deine Mitgliedschaft bei {this.gymName}{" "}
          anzutreten.
        </p>
        <p>
          Akzeptiere jetzt über den folgenden Link:
          <p>
            <a
              href={`http://localhost:3000/accept-invitation?token={${this.invitationToken}}`}
            >
              Beitreten
            </a>
          </p>
        </p>
        <Ending />
      </>
    );
  }
}
