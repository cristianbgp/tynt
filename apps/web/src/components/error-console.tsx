export function ErrorConsole({ error }: { error: string }) {
  return (
    <section id="error-console" className="error-console row-start-3 grid max-h-[160px] grid-cols-[max-content_minmax(0,1fr)] gap-[14px] overflow-auto whitespace-pre-wrap border-t-[3px] border-[var(--error)] bg-[var(--error-background)] px-[16px] py-[10px] text-[#7a1710] max-[560px]:row-start-4 max-[560px]:max-h-[min(160px,30dvh)] max-[560px]:min-w-0 max-[560px]:grid-cols-1 max-[560px]:gap-[6px] max-[560px]:[overflow-wrap:anywhere]" role="alert" aria-label="Errors" hidden={!error}>
      <strong className="error-label uppercase tracking-[0.08em] text-[var(--error)]">Error</strong>
      <span>{error}</span>
    </section>
  );
}
