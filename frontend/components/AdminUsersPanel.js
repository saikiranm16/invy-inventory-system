"use client";

export default function AdminUsersPanel({
  currentUserId,
  error,
  loading,
  roleUpdatingId,
  summary,
  users,
  onRoleChange,
}) {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-header">
        <div>
          <p className="dashboard-panel-eyebrow">Admin Panel</p>
          <h3 className="dashboard-panel-title">Workspace access</h3>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="dashboard-value-card">
          <span>Total users</span>
          <strong>{summary?.totalUsers ?? 0}</strong>
        </div>
        <div className="dashboard-value-card">
          <span>Admins</span>
          <strong>{summary?.admins ?? 0}</strong>
        </div>
        <div className="dashboard-value-card">
          <span>Standard users</span>
          <strong>{summary?.standardUsers ?? 0}</strong>
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
            Loading users...
          </p>
        ) : users.length ? (
          users.map((member) => {
            const isCurrentUser = member.id === currentUserId;
            const nextRole = member.role === "admin" ? "user" : "admin";

            return (
              <article
                key={member.id}
                className="rounded-[1.5rem] border border-[var(--border-soft)] bg-white/80 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-semibold text-[var(--foreground)]">
                        {member.name}
                      </h4>
                      <span className="rounded-full bg-[#eef7ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                        {member.role}
                      </span>
                      {isCurrentUser ? (
                        <span className="rounded-full bg-[#f0f4f8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#486581]">
                          You
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {member.email}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {member.phone}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRoleChange(member, nextRole)}
                    disabled={roleUpdatingId === member.id}
                    className="secondary-btn"
                  >
                    {roleUpdatingId === member.id
                      ? "Updating..."
                      : member.role === "admin"
                        ? "Demote to user"
                        : "Promote to admin"}
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <p className="rounded-[1.5rem] border border-dashed border-[#bcccdc] px-4 py-8 text-center text-sm text-[#486581]">
            No users found yet.
          </p>
        )}
      </div>
    </section>
  );
}
