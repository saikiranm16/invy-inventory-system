"use client";

export default function CaptchaField({
  challenge,
  value,
  onChange,
  onRefresh,
  disabled,
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-white/80 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-strong)]">
            Security check
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
            {challenge?.prompt || "Loading captcha..."}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="secondary-btn px-4 py-2 text-sm"
          disabled={disabled}
        >
          Refresh
        </button>
      </div>

      <input
        className="field mt-4"
        inputMode="numeric"
        placeholder="Enter captcha answer"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required
      />
    </div>
  );
}
