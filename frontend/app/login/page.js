"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import CaptchaField from "../../components/CaptchaField";
import Navbar from "../../components/Navbar";
import { AuthContext } from "../../context/AuthContext";
import { AppPreferencesContext } from "../../context/AppPreferencesContext";
import { getErrorMessage } from "../../services/api";
import { getCaptcha, loginUser } from "../../services/authService";
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
} from "../../utils/authValidation";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    captchaId: "",
    captchaAnswer: "",
  });
  const [captcha, setCaptcha] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user, isHydrated } = useContext(AuthContext);
  const { t } = useContext(AppPreferencesContext);
  const router = useRouter();

  const loadCaptcha = async () => {
    try {
      const res = await getCaptcha();
      setCaptcha(res.data);
      setForm((current) => ({
        ...current,
        captchaId: res.data.captchaId,
        captchaAnswer: "",
      }));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load captcha right now."));
    }
  };

  useEffect(() => {
    if (isHydrated && user?.token) {
      router.replace("/dashboard");
      return;
    }

    if (isHydrated) {
      let active = true;

      const primeCaptcha = async () => {
        try {
          const res = await getCaptcha();

          if (active) {
            setCaptcha(res.data);
            setForm((current) => ({
              ...current,
              captchaId: res.data.captchaId,
              captchaAnswer: "",
            }));
          }
        } catch (err) {
          if (active) {
            setError(getErrorMessage(err, "Unable to load captcha right now."));
          }
        }
      };

      primeCaptcha();

      return () => {
        active = false;
      };
    }
  }, [isHydrated, router, user?.token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const normalizedEmail = normalizeEmail(form.email);
    const validationError =
      validateEmail(normalizedEmail) ||
      validatePassword(form.password, true) ||
      (!form.captchaAnswer.trim() ? "Solve the captcha before logging in." : null);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await loginUser({
        email: normalizedEmail,
        password: form.password,
        captchaId: form.captchaId,
        captchaAnswer: form.captchaAnswer,
      });
      login(res.data);
      router.replace("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to login right now."));
      await loadCaptcha();
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
            <h2 className="text-3xl font-semibold tracking-tight text-[#102a43]">
              {t("login.formTitle", "Login")}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#486581]">
              {t("login.formBody", "Use your email and password to open Invy.")}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <input
                className="field"
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />

              <input
                className="field"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />

              <CaptchaField
                challenge={captcha}
                value={form.captchaAnswer}
                onChange={(captchaAnswer) =>
                  setForm((current) => ({ ...current, captchaAnswer }))
                }
                onRefresh={loadCaptcha}
                disabled={loading}
              />

              <div className="flex items-center justify-between gap-3 text-sm">
                <Link href="/forgot-password" className="font-semibold text-[var(--accent)]">
                  Forgot password?
                </Link>
                <span className="text-[var(--muted)]">
                  Captcha is required for login
                </span>
              </div>

              {error ? (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="primary-btn w-full" disabled={loading}>
                {loading
                  ? t("login.loading", "Signing in...")
                  : t("login.submit", "Login")}
              </button>
            </form>

            <p className="mt-6 text-sm text-[#486581]">
              {t("login.registerPrompt", "Need an account?")}{" "}
              <Link href="/register" className="font-semibold text-[#ff7a59]">
                {t("login.registerLink", "Create one here")}
              </Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
