export function ErrorConsole({ error }: { error: string }) {
  return (
    <section id="error-console" className="error-console" role="alert" aria-label="Errors" hidden={!error}>
      <strong className="error-label">Error</strong>
      <span>{error}</span>
    </section>
  );
}
