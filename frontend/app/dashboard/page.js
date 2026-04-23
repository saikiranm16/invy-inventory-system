"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import AdminActivityPanel from "../../components/AdminActivityPanel";
import AdminUsersPanel from "../../components/AdminUsersPanel";
import SettingsPanel from "../../components/SettingsPanel";
import WorkspaceDock from "../../components/WorkspaceDock";
import WorkspaceTopbar from "../../components/WorkspaceTopbar";
import { AuthContext } from "../../context/AuthContext";
import { AppPreferencesContext } from "../../context/AppPreferencesContext";
import { getErrorMessage, isRequestCanceled } from "../../services/api";
import { getRecentAdminActivity } from "../../services/adminActivityService";
import { getDashboard } from "../../services/dashboardService";
import { getUsers, updateUserRole as updateUserRoleRequest } from "../../services/userService";

const donutColors = ["#1f8ef1", "#4fd1a1", "#ffbf66", "#8b7dff", "#ff7a59"];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function Dashboard() {
  const [data, setData] = useState({
    totalItems: 0,
    totalCategories: 0,
    totalQuantity: 0,
    totalStockValue: 0,
    inStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    lowStockItems: [],
    categoryBreakdown: [],
    stockTrend: [],
    recentItems: [],
  });
  const [error, setError] = useState("");
  const [teamError, setTeamError] = useState("");
  const [teamLoading, setTeamLoading] = useState(false);
  const [roleUpdatingId, setRoleUpdatingId] = useState("");
  const [activityError, setActivityError] = useState("");
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [teamData, setTeamData] = useState({
    users: [],
    summary: {
      totalUsers: 0,
      admins: 0,
      standardUsers: 0,
    },
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, isAdmin, isHydrated, updateProfile } = useContext(AuthContext);
  const { t } = useContext(AppPreferencesContext);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!user?.token) {
      router.replace("/login");
      return;
    }

    const controller = new AbortController();
    let active = true;

    const fetchData = async () => {
      setError("");
      setTeamError("");
      setActivityError("");

      if (isAdmin) {
        setTeamLoading(true);
        setActivityLoading(true);
      }

      try {
        const [dashboardRes, usersRes, activityRes] = await Promise.all([
          getDashboard(user.token, {
            signal: controller.signal,
          }),
          isAdmin
            ? getUsers(user.token, {
                signal: controller.signal,
              })
            : Promise.resolve(null),
          isAdmin
            ? getRecentAdminActivity(user.token, {
                signal: controller.signal,
              })
            : Promise.resolve(null),
        ]);

        if (active) {
          setData(dashboardRes.data);

          if (usersRes) {
            setTeamData(usersRes.data);
          } else {
            setTeamData({
              users: [],
              summary: {
                totalUsers: 0,
                admins: 0,
                standardUsers: 0,
              },
            });
          }

          setActivityLogs(activityRes?.data?.logs || []);
        }
      } catch (err) {
        if (active && !isRequestCanceled(err)) {
          setError(getErrorMessage(err, "Unable to load dashboard right now."));
          if (isAdmin) {
            setTeamError(getErrorMessage(err, "Unable to load workspace users."));
            setActivityError(getErrorMessage(err, "Unable to load admin activity."));
          }
        }
      } finally {
        if (active && isAdmin) {
          setTeamLoading(false);
          setActivityLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
      controller.abort();
    };
  }, [isAdmin, isHydrated, refreshKey, router, user?.token]);

  const handleRoleChange = async (member, nextRole) => {
    if (!user?.token || !isAdmin) {
      return;
    }

    setTeamError("");
    setRoleUpdatingId(member.id);

    try {
      const res = await updateUserRoleRequest(user.token, member.id, nextRole);

      if (res.data.user.id === user.id) {
        updateProfile(res.data.user);
        setTeamData({
          users: [],
          summary: {
            totalUsers: 0,
            admins: 0,
            standardUsers: 0,
          },
        });
        return;
      }

      const [usersRes, activityRes] = await Promise.all([
        getUsers(user.token),
        getRecentAdminActivity(user.token),
      ]);
      setTeamData(usersRes.data);
      setActivityLogs(activityRes.data.logs || []);
    } catch (err) {
      setTeamError(getErrorMessage(err, "Unable to update this user's role."));
    } finally {
      setRoleUpdatingId("");
    }
  };

  const donutStops = useMemo(
    () =>
      data.categoryBreakdown
        .slice(0, 5)
        .reduce(
          (result, category, index) => {
            const start = result.total;
            const end = start + category.percentage;

            return {
              total: end,
              stops: [
                ...result.stops,
                `${donutColors[index % donutColors.length]} ${start}% ${end}%`,
              ],
            };
          },
          { total: 0, stops: [] }
        )
        .stops.join(", "),
    [data.categoryBreakdown]
  );

  const selectedCategory = useMemo(
    () =>
      data.categoryBreakdown.find(
        (category) => category.name === selectedCategoryName
      ) || null,
    [data.categoryBreakdown, selectedCategoryName]
  );

  const stats = [
    {
      label: "Products",
      value: data.totalItems.toLocaleString("en-IN"),
      accent: "from-[#6f7cff] to-[#4b5eff]",
      icon: "IT",
    },
    {
      label: "In Stock",
      value: data.inStockCount.toLocaleString("en-IN"),
      accent: "from-[#4fd1a1] to-[#13986e]",
      icon: "OK",
    },
    {
      label: "Low Stock",
      value: data.lowStockCount.toLocaleString("en-IN"),
      accent: "from-[#ffbf66] to-[#f08d24]",
      icon: "LS",
    },
    {
      label: "Out of Stock",
      value: data.outOfStockCount.toLocaleString("en-IN"),
      accent: "from-[#ff8daa] to-[#e6517f]",
      icon: "OS",
    },
  ];

  const sidebarLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/inventory", label: "Inventory" },
  ];

  const handleDonutClick = (event) => {
    const visibleBreakdown = data.categoryBreakdown.slice(0, 5);

    if (!visibleBreakdown.length) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const outerRadius = rect.width / 2;
    const innerRadius = outerRadius * 0.58;

    if (distance < innerRadius || distance > outerRadius) {
      return;
    }

    const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 450) % 360;
    const clickedPercent = (angle / 360) * 100;
    let runningTotal = 0;

    for (const category of visibleBreakdown) {
      runningTotal += category.percentage;

      if (clickedPercent <= runningTotal) {
        setSelectedCategoryName(category.name);
        return;
      }
    }

    setSelectedCategoryName(visibleBreakdown[visibleBreakdown.length - 1]?.name || "");
  };

  if (!isHydrated || !user?.token) {
    return null;
  }

  return (
    <div className="dashboard-shell min-h-screen">
      <div className="dashboard-grid min-h-screen">
        <aside className="dashboard-sidebar">
          <div className="dashboard-brand">
            <div className="dashboard-brand-logo-wrap">
              <Image
                src="/logo.png"
                alt="Invy logo"
                width={160}
                height={160}
                className="dashboard-brand-logo"
                priority
              />
            </div>
            <div>
              <p className="dashboard-brand-name">Invy</p>
              <p className="dashboard-brand-subtitle">Smart Inventory</p>
            </div>
          </div>

          <nav className="dashboard-nav">
            {sidebarLinks.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                className={`dashboard-nav-link ${
                  pathname === link.href ? "dashboard-nav-link-active" : ""
                }`}
              >
                <span className="dashboard-nav-icon" />
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="dashboard-content">
          <div className="dashboard-topbar">
            <WorkspaceTopbar />
          </div>

          <main className="dashboard-main">
            <section className="dashboard-headline">
              <div>
                <h1 className="dashboard-title">Dashboard</h1>
                <p className="dashboard-subtitle">
                  {isAdmin
                    ? t(
                        "dashboard.subtitle",
                        "Keep a close eye on products, stock value, category coverage, and low-stock alerts from one place."
                      )
                    : "Browse inventory insights in read-only mode and open the product list whenever you need stock details."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/inventory")}
                className="primary-btn"
              >
                {t("dashboard.openInventory", "Open inventory")}
              </button>
            </section>

            {error ? (
              <div className="rounded-[1.25rem] bg-red-50 px-5 py-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <section className="dashboard-stats-grid">
              {stats.map((stat) => (
                <button
                  key={stat.label}
                  type="button"
                  onClick={() => router.push("/inventory")}
                  className="dashboard-stat-card"
                >
                  <div className={`dashboard-stat-icon bg-gradient-to-br ${stat.accent}`}>
                    {stat.icon}
                  </div>
                  <div className="dashboard-stat-copy">
                    <p className="dashboard-stat-label">{stat.label}</p>
                    <h2 className="dashboard-stat-value">{stat.value}</h2>
                    <div className="dashboard-stat-trace" />
                  </div>
                </button>
              ))}
            </section>

            <section className="dashboard-analytics-grid">
              <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <div>
                    <p className="dashboard-panel-eyebrow">Stock Overview</p>
                    <h3 className="dashboard-panel-title">Inventory value</h3>
                  </div>
                </div>

                <div className="dashboard-value-panel">
                  <p className="dashboard-value-amount">
                    {currencyFormatter.format(data.totalStockValue || 0)}
                  </p>
                  <p className="dashboard-value-copy">
                    {isAdmin
                      ? "Use this as a live snapshot of the current value of all stocked items."
                      : "This summarizes the current inventory catalog while product editing stays restricted to admins."}
                  </p>
                  <div className="dashboard-value-grid">
                    <div className="dashboard-value-card">
                      <span>Total items</span>
                      <strong>{data.totalItems.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="dashboard-value-card">
                      <span>Total units</span>
                      <strong>{data.totalQuantity.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="dashboard-value-card">
                      <span>Categories</span>
                      <strong>{data.totalCategories.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>
                </div>
              </article>

              <article className="dashboard-panel dashboard-donut-panel">
                <div className="dashboard-panel-header">
                  <div>
                    <p className="dashboard-panel-eyebrow">Stock by Category</p>
                    <h3 className="dashboard-panel-title">Category breakdown</h3>
                  </div>
                </div>

                <div className="dashboard-donut-layout">
                  <div
                    className="dashboard-donut"
                    role="button"
                    tabIndex={0}
                    aria-label="Category breakdown chart"
                    onClick={handleDonutClick}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedCategoryName(
                          data.categoryBreakdown[0]?.name || ""
                        );
                      }
                    }}
                    style={{
                      background: donutStops
                        ? `conic-gradient(${donutStops})`
                        : "conic-gradient(#dfe8ef 0% 100%)",
                    }}
                  >
                    <div className="dashboard-donut-center">
                      <strong>
                        {selectedCategory
                          ? selectedCategory.quantity.toLocaleString("en-IN")
                          : data.totalQuantity.toLocaleString("en-IN")}
                      </strong>
                      <span>{selectedCategoryName || "Total Units"}</span>
                    </div>
                  </div>

                  <div className="dashboard-category-list">
                    {selectedCategoryName ? (
                      <p className="rounded-[1rem] bg-[#eef7ff] px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
                        Selected category: {selectedCategoryName}
                      </p>
                    ) : null}
                    {data.categoryBreakdown.length ? (
                      data.categoryBreakdown.slice(0, 5).map((category, index) => (
                        <button
                          key={category.name}
                          type="button"
                          onClick={() => setSelectedCategoryName(category.name)}
                          className={`dashboard-category-row ${
                            selectedCategoryName === category.name
                              ? "dashboard-category-row-active"
                              : ""
                          }`}
                        >
                          <div className="dashboard-category-meta">
                            <span
                              className="dashboard-category-dot"
                              style={{
                                backgroundColor:
                                  donutColors[index % donutColors.length],
                              }}
                            />
                            <span>{category.name}</span>
                          </div>
                          <div className="dashboard-category-values">
                            <span>{category.percentage}%</span>
                            <strong>{category.quantity}</strong>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--muted)]">
                        No category data yet.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            </section>

            <section className="dashboard-bottom-grid">
              <article className="dashboard-panel dashboard-items-panel">
                <div className="dashboard-panel-header">
                  <div>
                    <p className="dashboard-panel-eyebrow">
                      {t("dashboard.recentProducts", "Recent products")}
                    </p>
                    <h3 className="dashboard-panel-title">
                      {t("dashboard.recentChanges", "Latest inventory changes")}
                    </h3>
                  </div>
                  <Link href="/inventory" className="secondary-btn">
                    {t("dashboard.viewAll", "View all")}
                  </Link>
                </div>

                <div className="dashboard-table">
                  <div className="dashboard-table-head">
                    <span>Item</span>
                    <span>Category</span>
                    <span>Stock</span>
                    <span>Status</span>
                  </div>
                  <div className="dashboard-table-body">
                    {data.recentItems.length ? (
                      data.recentItems.map((item) => (
                        <div key={item._id} className="dashboard-table-row">
                          <div className="dashboard-item-cell">
                            <div className="dashboard-item-avatar">
                              {item.name.slice(0, 1).toUpperCase()}
                            </div>
                            <span>{item.name}</span>
                          </div>
                          <span>{item.category?.name || "Uncategorized"}</span>
                          <span>{item.quantity}</span>
                          <span
                            className={`dashboard-status-badge ${
                              item.quantity === 0
                                ? "dashboard-status-out"
                                : item.quantity < 5
                                  ? "dashboard-status-low"
                                  : "dashboard-status-good"
                            }`}
                          >
                            {item.quantity === 0
                              ? "Out of Stock"
                              : item.quantity < 5
                                ? "Low Stock"
                                : "In Stock"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--muted)]">
                        No products yet. Add inventory from the inventory page.
                      </p>
                    )}
                  </div>
                </div>
              </article>

              <article className="dashboard-panel dashboard-actions-panel">
                <div className="dashboard-panel-header">
                  <div>
                    <p className="dashboard-panel-eyebrow">Quick Actions</p>
                    <h3 className="dashboard-panel-title">
                      {isAdmin ? "Admin workflow" : "User workflow"}
                    </h3>
                  </div>
                </div>

                <div className="dashboard-actions-grid">
                  <Link href="/inventory" className="dashboard-action-card">
                    <span className="dashboard-action-icon">VI</span>
                    <span>View products</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="dashboard-action-card"
                  >
                    <span className="dashboard-action-icon">PR</span>
                    <span>Account</span>
                  </button>
                  {isAdmin ? (
                    <>
                      <Link href="/inventory" className="dashboard-action-card">
                        <span className="dashboard-action-icon">AD</span>
                        <span>Add product</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => setIsSettingsOpen(true)}
                        className="dashboard-action-card"
                      >
                        <span className="dashboard-action-icon">TO</span>
                        <span>Tools</span>
                      </button>
                    </>
                  ) : null}
                </div>

                <div className="dashboard-alert-box">
                  <p className="dashboard-panel-eyebrow">
                    {t("dashboard.lowStockTitle", "Low stock alert")}
                  </p>
                  <div className="mt-3 space-y-2">
                    {data.lowStockItems.length ? (
                      data.lowStockItems.slice(0, 4).map((item) => (
                        <div key={item._id} className="dashboard-alert-row">
                          <span>{item.name}</span>
                          <strong>{item.quantity}</strong>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--muted)]">
                        {t(
                          "dashboard.lowStockEmpty",
                          "Everything looks healthy right now."
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            </section>

            {isAdmin ? (
              <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <AdminUsersPanel
                  currentUserId={user.id}
                  error={teamError}
                  loading={teamLoading}
                  roleUpdatingId={roleUpdatingId}
                  summary={teamData.summary}
                  users={teamData.users}
                  onRoleChange={handleRoleChange}
                />
                <AdminActivityPanel
                  error={activityError}
                  loading={activityLoading}
                  logs={activityLogs}
                />
              </section>
            ) : null}
          </main>

          <WorkspaceDock
            variant="sidebar"
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {isSettingsOpen ? (
            <SettingsPanel
              onClose={() => setIsSettingsOpen(false)}
              onAfterSync={() => setRefreshKey((current) => current + 1)}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}
