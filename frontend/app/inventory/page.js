"use client";

import {
  useContext,
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
} from "react";
import Navbar from "../../components/Navbar";
import SettingsPanel from "../../components/SettingsPanel";
import WorkspaceDock from "../../components/WorkspaceDock";
import WorkspaceTopbar from "../../components/WorkspaceTopbar";
import { AuthContext } from "../../context/AuthContext";
import { AppPreferencesContext } from "../../context/AppPreferencesContext";
import {
  getErrorMessage,
  isRequestCanceled,
} from "../../services/api";
import { createCategory, getCategories } from "../../services/categoryService";
import {
  createItem,
  deleteItem,
  getItems,
  restockItem,
  updateItem,
} from "../../services/itemService";
import { buildItemFilters } from "../../services/requestHelpers";

const emptyForm = {
  name: "",
  quantity: "",
  price: "",
  category: "",
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const [categoryName, setCategoryName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [restockDrafts, setRestockDrafts] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);
  const { user, isAdmin, isHydrated } = useContext(AuthContext);
  const { t } = useContext(AppPreferencesContext);

  const refreshItems = async (token, filters = {}) => {
    setLoading(true);
    setError("");

    try {
      const res = await getItems(token, filters);
      startTransition(() => {
        setItems(res.data);
      });
    } catch (err) {
      if (!isRequestCanceled(err)) {
        setError(getErrorMessage(err, "Unable to load inventory."));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isHydrated || !user?.token) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    const loadCategories = async () => {
      try {
        const res = await getCategories(user.token, {
          signal: controller.signal,
        });

        if (active) {
          setCategories(res.data);
        }
      } catch (err) {
        if (active && !isRequestCanceled(err)) {
          setError(
            getErrorMessage(err, "Unable to load inventory workspace.")
          );
        }
      }
    };

    loadCategories();

    return () => {
      active = false;
      controller.abort();
    };
  }, [isHydrated, refreshKey, user?.token]);

  useEffect(() => {
    if (!isHydrated || !user?.token) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    const loadFilteredItems = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await getItems(
          user.token,
          buildItemFilters(deferredSearch, selectedCategory),
          {
            signal: controller.signal,
          }
        );

        if (active) {
          startTransition(() => {
            setItems(res.data);
          });
        }
      } catch (err) {
        if (active && !isRequestCanceled(err)) {
          setError(getErrorMessage(err, "Unable to load inventory."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadFilteredItems();

    return () => {
      active = false;
      controller.abort();
    };
  }, [deferredSearch, isHydrated, refreshKey, selectedCategory, user?.token]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const currentFilters = buildItemFilters(deferredSearch, selectedCategory);
  const lowStockItems = items.filter((item) => item.quantity < 5);
  const totalInventoryValue = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
    0
  );
  const visibleItems = items.filter((item) => {
    if (selectedStatus === "low") {
      return item.quantity > 0 && item.quantity < 5;
    }

    if (selectedStatus === "out") {
      return item.quantity === 0;
    }

    return true;
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user?.token || !isAdmin) {
      return;
    }

    setError("");
    setFeedback("");

    try {
      if (editingId) {
        await updateItem(user.token, editingId, form);
        setFeedback("Product updated successfully.");
      } else {
        await createItem(user.token, form);
        setFeedback("Product added successfully.");
      }

      resetForm();
      await refreshItems(user.token, currentFilters);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save product."));
    }
  };

  const handleDelete = async (id) => {
    if (!user?.token || !isAdmin || !window.confirm("Delete this product?")) {
      return;
    }

    setError("");
    setFeedback("");

    try {
      await deleteItem(user.token, id);
      setFeedback("Product deleted.");
      await refreshItems(user.token, currentFilters);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete product."));
    }
  };

  const handleRestock = async (id) => {
    const quantity = Number(restockDrafts[id]);

    if (!user?.token || !isAdmin || Number.isNaN(quantity) || quantity === 0) {
      setError("Enter a non-zero quantity change before updating stock.");
      return;
    }

    setError("");
    setFeedback("");

    try {
      await restockItem(user.token, id, quantity);
      setRestockDrafts((current) => ({ ...current, [id]: "" }));
      setFeedback("Quantity updated.");
      await refreshItems(user.token, currentFilters);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update quantity."));
    }
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();

    if (!user?.token || !isAdmin) {
      return;
    }

    setError("");
    setFeedback("");

    try {
      const res = await createCategory(user.token, { name: categoryName });
      const categoriesRes = await getCategories(user.token);
      setCategories(categoriesRes.data);
      setCategoryName("");
      setForm((current) => ({ ...current, category: res.data._id }));
      setFeedback("Category created.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create category."));
    }
  };

  if (!isHydrated || !user?.token) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="page-shell">
        <WorkspaceTopbar />

        <section className="inventory-summary-grid">
          <div className="glass-panel inventory-summary-card">
            <p className="inventory-summary-label">Visible products</p>
            <p className="inventory-summary-value">{visibleItems.length}</p>
          </div>
          <div className="glass-panel inventory-summary-card">
            <p className="inventory-summary-label">
              {isAdmin ? "Total inventory value" : "Low stock items"}
            </p>
            <p className="inventory-summary-value">
              {isAdmin
                ? currencyFormatter.format(totalInventoryValue)
                : lowStockItems.length.toLocaleString("en-IN")}
            </p>
            <p className="inventory-summary-copy">
              {isAdmin
                ? "Based on the products currently visible."
                : "Users stay in view-only mode while browsing products."}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-[1.5rem] border border-[#ffd6bf] bg-[#fff5ee] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-[#b45a22]">
                {t("inventory.alertTitle", "Low stock items")}
              </p>
              <p className="mt-2 text-sm text-[#8c4b21]">
                {lowStockItems.length
                  ? lowStockItems
                      .slice(0, 8)
                      .map((item) => `${item.name} (${item.quantity})`)
                      .join(", ")
                  : t("inventory.alertEmpty", "No item is below 5 units right now.")}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <div className="glass-panel rounded-[2rem] p-6">
              <div className="grid gap-4 md:grid-cols-[1fr_240px]">
                <input
                  className="field"
                  placeholder="Search products by name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="field"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {[
                  { value: "all", label: "All" },
                  { value: "low", label: "Low Stock" },
                  { value: "out", label: "Out of Stock" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setSelectedStatus(filter.value)}
                    className={`secondary-btn px-4 py-2 text-sm ${
                      selectedStatus === filter.value
                        ? "border-[var(--accent)] bg-[color:var(--accent)] text-white"
                        : ""
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {error ? (
                <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              {feedback ? (
                <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {feedback}
                </p>
              ) : null}

              <div className="mt-6 grid gap-4">
                {loading ? (
                  <p className="rounded-[1.5rem] border border-dashed border-[#bcccdc] px-4 py-8 text-center text-sm text-[#486581]">
                    Loading inventory...
                  </p>
                ) : visibleItems.length ? (
                  visibleItems.map((item) => (
                    <article
                      key={item._id}
                      className="rounded-[1.5rem] border border-[#e9eff5] bg-white/85 p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="space-y-3 text-left"
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-semibold text-[#102a43]">
                              {item.name}
                            </h2>
                            <span
                              className={`status-pill ${
                                item.quantity === 0
                                  ? "bg-rose-100 text-rose-700"
                                  : item.quantity < 5
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              Qty {item.quantity}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-[#486581]">
                            <span className="rounded-full bg-[#f0f4f8] px-3 py-1">
                              {item.category?.name || "Uncategorized"}
                            </span>
                            {isAdmin ? (
                              <span className="rounded-full bg-[#fef3ec] px-3 py-1 text-[#d6451b]">
                                {currencyFormatter.format(item.price || 0)}
                              </span>
                            ) : null}
                          </div>
                        </button>

                        <div className="w-full max-w-sm space-y-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedItem(item)}
                              className="secondary-btn flex-1"
                            >
                              View
                            </button>
                            {isAdmin ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(item._id);
                                    setForm({
                                      name: item.name,
                                      quantity: String(item.quantity),
                                      price: String(item.price),
                                      category: item.category?._id || "",
                                    });
                                  }}
                                  className="secondary-btn flex-1"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(item._id)}
                                  className="secondary-btn flex-1 border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </>
                            ) : null}
                          </div>

                          {isAdmin ? (
                            <div className="flex gap-2">
                              <input
                                className="field"
                                type="number"
                                placeholder="+/- Qty"
                                value={restockDrafts[item._id] || ""}
                                onChange={(e) =>
                                  setRestockDrafts((current) => ({
                                    ...current,
                                    [item._id]: e.target.value,
                                  }))
                                }
                              />
                              <button
                                type="button"
                                onClick={() => handleRestock(item._id)}
                                className="primary-btn min-w-28"
                              >
                                Update
                              </button>
                            </div>
                          ) : (
                            <p className="rounded-[1.25rem] bg-[#f8fafc] px-4 py-3 text-sm text-[#486581]">
                              Product actions are restricted. You can search and
                              view details only.
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="rounded-[1.5rem] border border-dashed border-[#bcccdc] px-4 py-8 text-center text-sm text-[#486581]">
                    No products match your search, category, or stock filter.
                  </p>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="glass-panel rounded-[2rem] p-6">
              <p className="text-sm uppercase tracking-[0.22em] text-[#829ab1]">
                {isAdmin ? "Workspace tools" : "Read-only access"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#102a43]">
                {isAdmin ? "Manage products" : "Product browsing"}
              </h2>

              {isAdmin ? (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <input
                    className="field"
                    placeholder="Product name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="field"
                      type="number"
                      min="0"
                      placeholder="Quantity"
                      value={form.quantity}
                      onChange={(e) =>
                        setForm({ ...form, quantity: e.target.value })
                      }
                      required
                    />
                    <input
                      className="field"
                      type="number"
                      min="0"
                      placeholder="Price"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                    />
                  </div>
                  <select
                    className="field"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-3">
                    <button type="submit" className="primary-btn flex-1">
                      {editingId ? "Save changes" : "Add product"}
                    </button>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={resetForm}
                    >
                      Clear
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-6 rounded-[1.5rem] bg-[#f8fafc] p-5 text-sm leading-7 text-[#486581]">
                  Browse products by category, search by name, and open product
                  details without changing inventory data.
                </div>
              )}
            </div>

            {isAdmin ? (
              <div className="glass-panel rounded-[2rem] p-6">
                <p className="text-sm uppercase tracking-[0.22em] text-[#829ab1]">
                  Categories
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#102a43]">
                  Add a new category
                </h3>
                <form onSubmit={handleCategorySubmit} className="mt-6 space-y-4">
                  <input
                    className="field"
                    placeholder="Category name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                  />
                  <button type="submit" className="primary-btn w-full">
                    Create category
                  </button>
                </form>

                <div className="mt-6 flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <span
                      key={category._id}
                      className="rounded-full bg-[#f0f4f8] px-3 py-2 text-sm text-[#334e68]"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </section>

        

        {selectedItem ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
            <div className="settings-panel w-full max-w-lg rounded-[2rem] p-6 shadow-2xl sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-strong)]">
                    Product details
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
                    {selectedItem.name}
                  </h2>
                </div>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setSelectedItem(null)}
                >
                  Close
                </button>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                    Category
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                    {selectedItem.category?.name || "Uncategorized"}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                    Quantity
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                    {selectedItem.quantity}
                  </p>
                </div>
                {isAdmin ? (
                  <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-white/70 p-4 sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                      Price
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                      {currencyFormatter.format(selectedItem.price || 0)}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

      

      </main>
    </div>
  );
}
