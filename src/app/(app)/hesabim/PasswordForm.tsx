"use client";

import { useState, useTransition, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PasswordForm() {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);

    const password = (formData.get("password") as string) ?? "";
    const passwordConfirm = (formData.get("password_confirm") as string) ?? "";

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Şifreler birbiriyle eşleşmiyor.");
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Şifreniz güncellendi.");
        formRef.current?.reset();
      }
    });
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">
        Şifre Değiştir
      </h2>
      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Yeni Şifre
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Yeni Şifre (Tekrar)
            </label>
            <input
              type="password"
              name="password_confirm"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {isPending ? "Kaydediliyor..." : "Şifreyi Güncelle"}
          </button>
        </div>
      </form>
    </div>
  );
}
