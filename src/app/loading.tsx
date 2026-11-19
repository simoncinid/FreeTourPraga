export default function Loading() {
  return (
    <div className="container-page min-h-[60vh] py-16" role="status" aria-live="polite">
      <p className="text-muted">Caricamento pagina…</p>
      <div className="mt-8 grid gap-5 motion-safe:animate-pulse" aria-hidden="true">
        <div className="h-12 w-2/3 rounded bg-surface-soft" />
        <div className="h-5 w-full rounded bg-surface-soft" />
        <div className="h-5 w-4/5 rounded bg-surface-soft" />
        <div className="mt-6 h-48 rounded bg-surface-soft" />
      </div>
    </div>
  );
}
