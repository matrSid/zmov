"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

type Mode = "login" | "signup" | "forgot";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setSuccess(null);
  };

  const switchMode = (m: Mode) => {
    reset();
    setMode(m);
  };

  const handleEmailAuth = async () => {
    reset();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: displayName || null } },
        });
        if (signUpError) { setError(signUpError.message); return; }
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError(signInError.message); return; }

      router.push("/user");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    reset();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) { setError(resetError.message); return; }
      setSuccess("Check your inbox — we've sent a password reset link.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (mode === "forgot") handleForgotPassword();
      else handleEmailAuth();
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        .login-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0e0a0a;
          background-image:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(120, 30, 30, 0.55) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 80% 90%, rgba(60, 10, 10, 0.3) 0%, transparent 60%);
          padding: 1.5rem;
        }

        .card {
          width: 100%;
          max-width: 400px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          padding: 2.5rem 2.25rem;
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
          animation: fadeUp 0.4s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .logo {
          font-family: 'DM Serif Display', serif;
          font-size: 1.75rem;
          color: #fff;
          letter-spacing: -0.01em;
          margin-bottom: 0.2rem;
        }

        .logo span {
          color: #e05050;
        }

        .subtitle {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.35);
          margin-bottom: 2rem;
          font-weight: 300;
        }

        /* Pill toggle */
        .mode-toggle {
          display: flex;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 3px;
          margin-bottom: 1.75rem;
          gap: 3px;
        }

        .mode-btn {
          flex: 1;
          padding: 0.45rem 0;
          font-size: 0.82rem;
          font-weight: 500;
          border-radius: 7px;
          border: none;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
          background: transparent;
          color: rgba(255,255,255,0.45);
          font-family: 'DM Sans', sans-serif;
        }

        .mode-btn.active {
          background: rgba(220, 60, 60, 0.85);
          color: #fff;
          box-shadow: 0 2px 12px rgba(200,40,40,0.35);
        }

        .form-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.5rem;
          font-weight: 400;
          color: #fff;
          margin-bottom: 0.25rem;
        }

        .form-desc {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.35);
          margin-bottom: 1.5rem;
          font-weight: 300;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-bottom: 0.85rem;
        }

        .field label {
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .field input {
          width: 100%;
          padding: 0.6rem 0.85rem;
          border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.35);
          color: #fff;
          font-size: 0.875rem;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          box-sizing: border-box;
        }

        .field input:focus {
          border-color: rgba(220, 70, 70, 0.6);
          box-shadow: 0 0 0 3px rgba(200, 50, 50, 0.15);
        }

        .field input::placeholder { color: rgba(255,255,255,0.2); }

        .forgot-link {
          display: block;
          text-align: right;
          font-size: 0.75rem;
          color: rgba(220, 100, 100, 0.8);
          cursor: pointer;
          margin-top: -0.5rem;
          margin-bottom: 1.25rem;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          padding: 0;
          text-decoration: none;
          transition: color 0.2s;
        }

        .forgot-link:hover { color: #e05050; }

        .primary-btn {
          width: 100%;
          padding: 0.7rem;
          background: linear-gradient(135deg, #c53030 0%, #e05050 100%);
          color: #fff;
          font-weight: 600;
          font-size: 0.875rem;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 20px rgba(200,40,40,0.3);
          margin-bottom: 1rem;
          letter-spacing: 0.01em;
        }

        .primary-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(200,40,40,0.4);
        }

        .primary-btn:active:not(:disabled) { transform: translateY(0); }
        .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }

        .divider span {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.25);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .google-btn {
          width: 100%;
          padding: 0.65rem;
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.45);
          font-size: 0.82rem;
          font-weight: 500;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          cursor: not-allowed;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          position: relative;
        }

        .google-badge {
          font-size: 0.65rem;
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.3);
          padding: 1px 6px;
          border-radius: 4px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .error-box {
          background: rgba(200,40,40,0.12);
          border: 1px solid rgba(200,40,40,0.3);
          border-radius: 8px;
          padding: 0.6rem 0.85rem;
          font-size: 0.8rem;
          color: #f87171;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .success-box {
          background: rgba(40,180,100,0.1);
          border: 1px solid rgba(40,180,100,0.25);
          border-radius: 8px;
          padding: 0.6rem 0.85rem;
          font-size: 0.8rem;
          color: #6ee7b7;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .back-link {
          display: block;
          text-align: center;
          font-size: 0.78rem;
          color: rgba(220, 100, 100, 0.7);
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          padding: 0;
          margin-top: 0.5rem;
          transition: color 0.2s;
        }

        .back-link:hover { color: #e05050; }

        .slide-in {
          animation: fadeUp 0.3s ease both;
        }
      `}</style>

      <div className="login-root">
        <div className="card">
          {/* Logo */}
          <div className="logo">watch<span>.</span></div>
          <p className="subtitle">Your personal watch tracker</p>

          {mode !== "forgot" ? (
            <>
              {/* Mode toggle */}
              <div className="mode-toggle">
                <button
                  className={`mode-btn ${mode === "login" ? "active" : ""}`}
                  onClick={() => switchMode("login")}
                >
                  Log in
                </button>
                <button
                  className={`mode-btn ${mode === "signup" ? "active" : ""}`}
                  onClick={() => switchMode("signup")}
                >
                  Sign up
                </button>
              </div>

              <div className="slide-in" key={mode}>
                <p className="form-title">
                  {mode === "login" ? "Welcome back" : "Create account"}
                </p>
                <p className="form-desc">
                  {mode === "login"
                    ? "Sign in to continue to your watchlist."
                    : "Start tracking what you watch."}
                </p>

                {error && <div className="error-box">{error}</div>}

                {mode === "signup" && (
                  <div className="field">
                    <label>Display Name</label>
                    <input
                      type="text"
                      placeholder="How should we call you?"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                )}

                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>

                <div className="field">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>

                {mode === "login" && (
                  <button className="forgot-link" onClick={() => switchMode("forgot")}>
                    Forgot password?
                  </button>
                )}

                <button
                  className="primary-btn"
                  onClick={handleEmailAuth}
                  disabled={loading}
                >
                  {loading
                    ? "Please wait..."
                    : mode === "login"
                    ? "Log in"
                    : "Create account"}
                </button>

                <div className="divider"><span>or</span></div>

                <div className="google-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="rgba(255,255,255,0.2)"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="rgba(255,255,255,0.2)"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="rgba(255,255,255,0.2)"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="rgba(255,255,255,0.2)"/>
                  </svg>
                  Continue with Google
                  <span className="google-badge">Soon</span>
                </div>
              </div>
            </>
          ) : (
            /* Forgot password view */
            <div className="slide-in">
              <p className="form-title">Reset password</p>
              <p className="form-desc">
                Enter your email and we'll send you a reset link.
              </p>

              {error && <div className="error-box">{error}</div>}
              {success && <div className="success-box">{success}</div>}

              {!success && (
                <>
                  <div className="field">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>

                  <button
                    className="primary-btn"
                    onClick={handleForgotPassword}
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send reset link"}
                  </button>
                </>
              )}

              <button className="back-link" onClick={() => switchMode("login")}>
                ← Back to log in
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}