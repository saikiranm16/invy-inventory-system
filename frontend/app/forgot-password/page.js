"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CaptchaField from "../../components/CaptchaField";
import Navbar from "../../components/Navbar";
import { getErrorMessage } from "../../services/api";
import {
  forgotPassword,
  getCaptcha,
  resetPassword,
} from "../../services/authService";
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
} from "../../utils/authValidation";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [captcha, setCaptcha] = useState(null);
  const [requestForm, setRequestForm] = useState({
    email: "",
    captchaId: "",
    captchaAnswer: "",
  });
  const [resetForm, setResetForm] = useState({
    email: "",
    resetCode: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadCaptcha = async () => {
    try {
      const res = await getCaptcha();
      setCaptcha(res.data);
      setRequestForm((current) => ({
        ...current,
        captchaId: res.data.captchaId,
        captchaAnswer: "",
      }));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load captcha right now."));
    }
  };

  useEffect(() => {
    let active = true;

    const primeCaptcha = async () => {
      try {
        const res = await getCaptcha();

        if (active) {
          setCaptcha(res.data);
          setRequestForm((current) => ({
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
  }, []);

  const handleRequestReset = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const normalizedEmail = normalizeEmail(requestForm.email);
    const validationError =
      validateEmail(normalizedEmail) ||
      (!requestForm.captchaAnswer.trim()
        ? "Solve the captcha before requesting a reset."
        : null);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await forgotPassword({
        email: normalizedEmail,
        captchaId: requestForm.captchaId,
        captchaAnswer: requestForm.captchaAnswer,
      });

      setMessage(res.data.message);
      setResetForm((current) => ({
        ...current,
        email: normalizedEmail,
      }));
      setStep(2);
      await loadCaptcha();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to prepare a reset code right now."));
      await loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const normalizedEmail = normalizeEmail(resetForm.email);
    const validationError =
      validateEmail(normalizedEmail) ||
      (!resetForm.resetCode.trim() ? "Enter the reset code." : null) ||
      validatePassword(resetForm.password);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword({
        email: normalizedEmail,
        resetCode: resetForm.resetCode,
        password: resetForm.password,
      });
      setMessage(res.data.message);
      setStep(1);
      setRequestForm({
        email: normalizedEmail,
        captchaId: "",
        captchaAnswer: "",
      });
      setResetForm({
        email: normalizedEmail,
        resetCode: "",
        password: "",
      });
      await loadCaptcha();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to reset the password right now."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="page-shell flex min-h-[calc(100vh-88px)] items-center justify-center">
        <div className="w-full max-w-5xl">
          <section className="glass-panel rounded-[2.4rem] p-6 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <aside className="rounded-[2rem] bg-[linear-gradient(180deg,rgba(17,77,125,0.96),rgba(31,142,241,0.9))] p-6 text-white shadow-[0_24px_48px_rgba(19,78,138,0.24)]">
                <p className="text-xs uppercase tracking-[0.26em] text-white/70">
                  Recovery flow
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                  Reset your password without losing access
                </h1>
                <p className="mt-4 text-sm leading-7 text-white/80">
                  We verify the request with captcha first, then send a time-limited
                  reset code to your Gmail inbox.
                </p>

                <div className="mt-8 grid gap-3">
                  {[
                    { step: "1", title: "Verify email", active: step === 1 },
                    { step: "2", title: "Check Gmail", active: step === 2 },
                    { step: "3", title: "Create password", active: step === 2 },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className={`rounded-[1.25rem] border px-4 py-4 transition ${
                        item.active
                          ? "border-white/40 bg-white/14"
                          : "border-white/10 bg-white/6"
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                        Step {item.step}
                      </p>
                      <p className="mt-2 text-base font-semibold">{item.title}</p>
                    </div>
                  ))}
                </div>
              </aside>

              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-strong)]">
                  Account recovery
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#102a43]">
                  Forgot password
                </h2>
                <p className="mt-2 text-sm leading-7 text-[#486581]">
                  Request a reset code with captcha, then create a new password.
                </p>

                {step === 1 ? (
                  <form onSubmit={handleRequestReset} className="mt-8 space-y-4">
                    <input
                      className="field"
                      type="email"
                      placeholder="Email address"
                      value={requestForm.email}
                      onChange={(event) =>
                        setRequestForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      required
                    />

                    <CaptchaField
                      challenge={captcha}
                      value={requestForm.captchaAnswer}
                      onChange={(captchaAnswer) =>
                        setRequestForm((current) => ({ ...current, captchaAnswer }))
                      }
                      onRefresh={loadCaptcha}
                      disabled={loading}
                    />

                    {error ? (
                      <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                      </p>
                    ) : null}

                    {message ? (
                      <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {message}
                      </p>
                    ) : null}

                    <button type="submit" className="primary-btn w-full" disabled={loading}>
                      {loading ? "Preparing reset code..." : "Email reset code"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="mt-8 space-y-4">
                    <input
                      className="field"
                      type="email"
                      placeholder="Email address"
                      value={resetForm.email}
                      onChange={(event) =>
                        setResetForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      required
                    />
                    <input
                      className="field"
                      placeholder="Reset code"
                      value={resetForm.resetCode}
                      onChange={(event) =>
                        setResetForm((current) => ({
                          ...current,
                          resetCode: event.target.value,
                        }))
                      }
                      required
                    />
                    <input
                      className="field"
                      type="password"
                      placeholder="New password"
                      value={resetForm.password}
                      onChange={(event) =>
                        setResetForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      required
                    />

                    <p className="rounded-[1.5rem] border border-[#d8e8f7] bg-[#f7fbff] px-4 py-4 text-sm leading-7 text-[#486581]">
                      Check your Gmail inbox for the reset code, then paste it here
                      to create a new password.
                    </p>

                    {error ? (
                      <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                      </p>
                    ) : null}

                    {message ? (
                      <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {message}
                      </p>
                    ) : null}

                    <button type="submit" className="primary-btn w-full" disabled={loading}>
                      {loading ? "Resetting password..." : "Reset password"}
                    </button>
                  </form>
                )}

                <div className="mt-6 flex items-center justify-between gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError("");
                      setMessage("");
                    }}
                    className="secondary-btn"
                  >
                    Start over
                  </button>
                  <Link href="/login" className="font-semibold text-[var(--accent)]">
                    Back to login
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
