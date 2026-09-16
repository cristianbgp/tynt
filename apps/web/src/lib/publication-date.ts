const PUBLICATION_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

export function formatPublicationDate(value: string): string {
  return PUBLICATION_DATE_FORMATTER.format(new Date(`${value}T00:00:00Z`));
}
