export function PageHeader({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[2rem] border bg-card/80 p-8 shadow-soft backdrop-blur">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
      ) : null}
      <h1 className="mt-3 font-heading text-4xl font-semibold text-foreground">{title}</h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}
