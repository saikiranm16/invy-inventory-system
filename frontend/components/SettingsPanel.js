"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { AppPreferencesContext } from "../context/AppPreferencesContext";
import { getErrorMessage } from "../services/api";
import { updateProfile as updateProfileRequest } from "../services/authService";
import {
  COUNTRY_CODE_OPTIONS,
  buildPhoneNumber,
  normalizeEmail,
  sanitizePhoneNumberInput,
  splitPhoneNumber,
  validateEmail,
  validateName,
  validatePhone,
} from "../utils/authValidation";

export default function SettingsPanel({ onClose }) {
  const router = useRouter();
  const { user, logout, updateProfile } = useContext(AuthContext);
  const { t } = useContext(AppPreferencesContext);
  const phoneParts = splitPhoneNumber(user?.phone || "");
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    countryCode: phoneParts.countryCode,
    phoneNumber: phoneParts.phoneNumber,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const trimmedName = form.name.trim();
    const normalizedEmail = normalizeEmail(form.email);
    const phone = buildPhoneNumber(form.countryCode, form.phoneNumber);
    const validationError =
      validateName(trimmedName) ||
      validateEmail(normalizedEmail) ||
      validatePhone(phone);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSavingProfile(true);

    try {
      const res = await updateProfileRequest(user.token, {
        name: trimmedName,
        email: normalizedEmail,
        phone,
      });
      updateProfile(res.data.user);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update your profile right now."));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = () => {
    onClose?.();
    logout();
    router.replace("/login");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="settings-panel w-full max-w-4xl rounded-[2rem] p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-strong)]">
              {t("settings.title", "Settings")}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
              Account and workspace
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Manage your profile, security options, and session controls from one place.
            </p>
          </div>
          <button type="button" className="secondary-btn" onClick={onClose}>
            {t("settings.close", "Close")}
          </button>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[1.5rem] border border-[var(--border-soft)] bg-white/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Profile
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  Keep your account details accurate for secure access.
                </p>
              </div>
              <span className="rounded-full bg-[#eef7ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                {user?.role === "admin" ? "Admin" : "User"}
              </span>
            </div>

            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
              <input
                className="field"
                placeholder="Full name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
              <input
                className="field"
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
              <div className="grid gap-3 sm:grid-cols-[190px_1fr]">
                <select
                  className="field"
                  value={form.countryCode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      countryCode: event.target.value,
                    }))
                  }
                >
                  {COUNTRY_CODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  className="field"
                  type="tel"
                  placeholder="Phone number"
                  value={form.phoneNumber}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      phoneNumber: sanitizePhoneNumberInput(event.target.value),
                    }))
                  }
                  required
                />
              </div>

              <button
                type="submit"
                className="primary-btn w-full"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? "Saving..." : "Save profile"}
              </button>
            </form>
          </section>

          <div className="grid gap-6">
            <section className="rounded-[1.5rem] border border-[var(--border-soft)] bg-white/70 p-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {t("settings.security", "Security")}
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                {t(
                  "settings.securityCopy",
                  "Login and password reset now use captcha for safer access."
                )}
              </p>
              <Link href="/forgot-password" className="secondary-btn mt-5">
                {t("settings.resetPassword", "Reset password")}
              </Link>
            </section>

            <section className="rounded-[1.5rem] border border-[var(--border-soft)] bg-white/70 p-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Session
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Sign out quickly from the current device whenever you are done.
              </p>
              <button type="button" onClick={handleLogout} className="logout-btn mt-5">
                Logout
              </button>
            </section>
          </div>
        </div>

        {error ? (
          <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
