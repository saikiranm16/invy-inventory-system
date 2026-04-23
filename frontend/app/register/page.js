"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { AuthContext } from "../../context/AuthContext";
import { AppPreferencesContext } from "../../context/AppPreferencesContext";
import { getErrorMessage } from "../../services/api";
import { registerUser } from "../../services/authService";
import {
  buildPhoneNumber,
  COUNTRY_CODE_OPTIONS,
  normalizeEmail,
  sanitizePhoneNumberInput,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from "../../utils/authValidation";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    countryCode: COUNTRY_CODE_OPTIONS[0].value,
    phoneNumber: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user, isHydrated } = useContext(AuthContext);
  const { t } = useContext(AppPreferencesContext);
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && user?.token) {
      router.replace("/dashboard");
    }
  }, [isHydrated, router, user?.token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const trimmedName = form.name.trim();
    const normalizedEmail = normalizeEmail(form.email);
    const phone = buildPhoneNumber(form.countryCode, form.phoneNumber);
    const validationError =
      validateName(trimmedName) ||
      validateEmail(normalizedEmail) ||
      validatePhone(phone) ||
      validatePassword(form.password);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await registerUser({
        name: trimmedName,
        email: normalizedEmail,
        phone,
        password: form.password,
      });
      login(res.data);
      router.replace("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to register right now."));
    } finally {
      setLoading(false);
    }
  };

  if (!isHydrated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="page-shell flex min-h-[calc(100vh-88px)] items-center justify-center">
        <div className="w-full max-w-xl">
          <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <h1 className="text-3xl font-semibold tracking-tight text-[#102a43]">
              {t("register.title", "Create your Invy account")}
            </h1>
            <p className="mt-2 text-sm leading-7 text-[#486581]">
              {t(
                "register.body",
                "Create an account to start tracking products, categories, and stock updates."
              )}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <input
                className="field"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                className="field"
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />
              <div className="grid gap-3 sm:grid-cols-[190px_1fr]">
                <select
                  className="field"
                  value={form.countryCode}
                  onChange={(e) =>
                    setForm({ ...form, countryCode: e.target.value })
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
                  inputMode="numeric"
                  placeholder="Phone number"
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phoneNumber: sanitizePhoneNumberInput(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <input
                className="field"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />

              {error ? (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="primary-btn w-full" disabled={loading}>
                {loading
                  ? t("register.loading", "Creating account...")
                  : t("register.submit", "Register")}
              </button>
            </form>

            <p className="mt-6 text-sm text-[#486581]">
              {t("register.loginPrompt", "Already registered?")}{" "}
              <Link href="/login" className="font-semibold text-[#ff7a59]">
                {t("register.loginLink", "Login instead")}
              </Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
