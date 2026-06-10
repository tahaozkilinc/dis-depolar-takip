"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(error.message);
          return;
        }
        router.push("/dashboard");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || email },
          },
        });
        if (error) {
          setError(error.message);
          return;
        }
        setMessage(
          "Hesabınız oluşturuldu, yöneticinizin size depo ataması ve yetki vermesi gerekiyor."
        );
      }
    });
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-center text-xl font-semibold text-gray-900">
          Dış Depolar Takip Sistemi
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Devam etmek için giriş yapın
        </p>

        <div className="mb-6 flex rounded-md border bg-gray-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setMessage(null);
            }}
            className={`flex-1 rounded py-2 transition-colors ${
              mode === "login"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
              setMessage(null);
            }}
            className={`flex-1 rounded py-2 transition-colors ${
              mode === "signup"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Ad Soyad
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Adınız Soyadınız"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              E-posta
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="ornek@firma.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Şifre
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending
              ? "Bekleyin..."
              : mode === "login"
              ? "Giriş Yap"
              : "Kayıt Ol"}
          </button>
        </form>
      </div>
    </div>
  );
}
