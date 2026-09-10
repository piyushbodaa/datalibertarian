export function PageFallback() {
  return (
    <div className="space-y-5 py-6" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading this book</p>
      <div className="h-3 w-24 bg-ink/10" />
      <div className="h-9 w-2/3 max-w-md bg-ink/10" />
      <div className="h-4 w-full max-w-xl bg-ink/[0.07]" />
      <div className="h-4 w-5/6 max-w-lg bg-ink/[0.07]" />
      <div className="mt-8 border-y border-ink/15 py-8">
        <div className="h-16 w-3/4 max-w-sm bg-ink/10" />
      </div>
    </div>
  );
}
