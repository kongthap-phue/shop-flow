export default function AuthShell({ title, children, options }) {
  return (
    <section className="bg-mint px-4 pt-14 pb-16 sm:pt-20">
      <div className="mx-auto max-w-[29rem]">
        <h1 className="text-center text-[clamp(2.5rem,6vw,3.25rem)] leading-tight">{title}</h1>
        <div className="mt-8">{children}</div>

        <div className="my-10 flex items-center gap-4 text-sm font-semibold tracking-wide text-forest" aria-hidden="true">
          <span className="h-px flex-1 bg-forest/40" />
          หรือ
          <span className="h-px flex-1 bg-forest/40" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {options.map((o) => (
            <div key={o.question} className="flex flex-col items-center gap-3 rounded-lg bg-forest/[0.06] px-4 py-5 text-center">
              <p className="text-sm">{o.question}</p>
              {o.action}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Field({ id, label, required = true, hint, ...input }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[17px] font-semibold">
        {required && <span className="mr-1 text-teal">*</span>}
        {label}
      </label>
      <input id={id} required={required} placeholder={label} className="auth-input" {...input} />
      {hint && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
    </div>
  );
}

export const outlineButton =
  'inline-flex items-center justify-center rounded-full border-2 border-forest px-6 py-2 font-semibold text-forest transition-colors duration-150 hover:bg-forest hover:text-milk';
