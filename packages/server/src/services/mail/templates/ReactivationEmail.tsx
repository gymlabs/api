import React from "react";

import { Ending, Greeting } from "./components";
import { Email } from "./Email";

export class ReactivationEmail extends Email {
  constructor(
    private readonly name: string,
    private readonly reactivationToken: string,
    private readonly deletedAt: Date
  ) {
    super();
  }

  getSubject() {
    return "Account wieder aktivieren";
  }

  getBody() {
    return (
      <>
        <Greeting name={this.name} />
        <p>
          über folgenden Link kannst du dein Konto bis zum{" "}
          {this.deletedAt.toLocaleDateString()} wieder aktivieren:
          <p>
            <a
              href={`http://localhost:3000/reactivate-account?token={${this.reactivationToken}}`}
            >
              Account wieder aktivieren
            </a>
          </p>
        </p>
        <Ending />
      </>
    );
  }
}
