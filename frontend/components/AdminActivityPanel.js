"use client";

export default function AdminActivityPanel({ error, loading, logs }) {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-header">
        <div>
          <p className="dashboard-panel-eyebrow">Admin Activity</p>
          <h3 className="dashboard-panel-title">Recent audit trail</h3>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3">
        {loading ? (
          <p className="rounded-[1.5rem] border border-dashed border-[#bcccdc] px-4 py-8 text-center text-sm text-[#486581]">
            Loading recent admin activity...
          </p>
        ) : logs.length ? (
          logs.map((log) => (
            <article
              key={log.id}
              className="rounded-[1.5rem] border border-[var(--border-soft)] bg-white/80 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {String(log.action || "")
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (char) => char.toUpperCase())}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {log.admin?.name || "Unknown admin"} on {log.targetType}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted-strong)]">
                  {new Date(log.createdAt).toLocaleString("en-IN")}
                </span>
              </div>
              {log.details?.name || log.details?.email ? (
                <p className="mt-3 text-sm text-[var(--muted)]">
                  {log.details.name || log.details.email}
                </p>
              ) : null}
            </article>
          ))
        ) : (
          <p className="rounded-[1.5rem] border border-dashed border-[#bcccdc] px-4 py-8 text-center text-sm text-[#486581]">
            No admin activity has been recorded yet.
          </p>
        )}
      </div>
    </section>
  );
}
