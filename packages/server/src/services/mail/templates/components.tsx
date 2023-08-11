import * as React from "react";

export interface GreetingProps {
  name: string;
}

export function Greeting({ name }: GreetingProps) {
  return <p>Hallo {name},</p>;
}

export type EndingProps = Record<string, never>;

export function Ending(props: EndingProps) {
  return <p>- Dein GymLabs Team</p>;
}
