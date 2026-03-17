"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    alert("Google login is currently broken and will be fixed soon. Please use email and password to sign up / log in.");
  };

  const handleEmailAuth = async (mode: "login" | "signup") => {
    setError(null);
    setLoading(true);
    try {
      if (!email || !password) {
        setError("Please enter both email and password.");
        return;
      }

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: displayName || null,
            },
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        // Supabase may auto-sign-in after sign up depending on config; ensure session by logging in.
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/user");
    } catch (e) {
      setError("Something went wrong. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col gap-5 justify-center items-center bg-[radial-gradient(circle_at_top,_#382222_0%,_transparent_70%)]">
      <div className="flex flex-col items-center gap-2">
        <div className="flex">
          <p className="text-4xl font-semibold pr-2 mr-2 border-r-2">Login</p>
          <p className="text-4xl font-semibold">Signup</p>
        </div>
        <p className="text-sm text-white/70 text-center max-w-md">
          Google login is currently broken and will be fixed soon. Please use your email
          and a password to create an account or log in.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm px-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-neutral-900/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <input
          type="text"
          placeholder="Display name (optional)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-neutral-900/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-neutral-900/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500"
        />

        {error && (
          <p className="text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          onClick={() => handleEmailAuth("signup")}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded cursor-pointer hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Please wait..." : "Sign up with Email"}
        </button>

        <button
          onClick={() => handleEmailAuth("login")}
          disabled={loading}
          className="px-4 py-2 bg-neutral-700 text-white rounded cursor-pointer hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Please wait..." : "Log in with Email"}
        </button>

        <button
          onClick={handleGoogleLogin}
          className="mt-2 px-4 py-2 bg-neutral-600 text-white rounded cursor-pointer hover:bg-neutral-700"
        >
          Continue with Google (broken)
        </button>
      </div>
    </div>
  );
}
