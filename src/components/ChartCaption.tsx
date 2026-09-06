import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export function ChartCaption({ title, children }: Props) {
  return (
    <header className="mb-3">
      <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-ink/70">{children}</p>
    </header>
  );
}
