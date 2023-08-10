import { convert as convertHtmlToText } from "html-to-text";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

export abstract class Email {
  abstract getSubject(): string;
  abstract getBody(): React.ReactElement;

  getHtml(): string {
    return (
      "<!DOCTYPE html>" +
      renderToStaticMarkup(
        <html lang="en">
          <head>
            <meta charSet="UTF-8" />
            <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>{this.getSubject()}</title>
          </head>
          <body>{this.getBody()}</body>
        </html>
      )
    );
  }

  getText(): string {
    return convertHtmlToText(this.getHtml());
  }
}
