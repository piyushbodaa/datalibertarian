import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export function ChartCaption({ title, children }: Props) {
  return (
    <header className="mb-4">
      <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-ink/70">{children}</p>
    </header>
  );
}
