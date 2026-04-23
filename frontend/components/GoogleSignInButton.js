"use client";

import { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ onCredential, disabled }) {
  const buttonRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) {
      return;
    }

    let active = true;
    const existingScript = document.querySelector(
      'script[data-google-identity="true"]'
    );

    const renderButton = () => {
      if (!active || !window.google?.accounts?.id || !buttonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            onCredential(response.credential);
          }
        },
      });

      buttonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "signin_with",
        width: 320,
      });
      setIsReady(true);
    };

    if (existingScript) {
      renderButton();
      return () => {
        active = false;
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = renderButton;
    script.onerror = () => {
      if (active) {
        setError("Unable to load Google Sign-In.");
      }
    };
    document.head.appendChild(script);

    return () => {
      active = false;
    };
  }, [onCredential]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[var(--border-soft)] bg-white/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Google sign-in is optional
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Continue with email for now. Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
              and `GOOGLE_CLIENT_ID` later if you want one-tap sign-in.
            </p>
          </div>
          <span className="rounded-full bg-[#eef7ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Email mode
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        ref={buttonRef}
        className={`min-h-[44px] ${disabled ? "pointer-events-none opacity-60" : ""}`}
      />
      {!isReady && !error ? (
        <p className="text-sm text-[var(--muted)]">Loading Google Sign-In...</p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
