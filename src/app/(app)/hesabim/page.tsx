import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import PasswordForm from "./PasswordForm";
import FullNameForm from "./FullNameForm";

export default async function HesabimPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle<Profile>();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Hesabım</h1>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Hesap Bilgileri
        </h2>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">E-posta</dt>
            <dd className="font-medium text-gray-900">
              {profile?.email ?? session.user.email ?? "-"}
            </dd>
          </div>
        </dl>
      </div>

      <FullNameForm initialFullName={profile?.full_name ?? ""} />

      <PasswordForm />
    </div>
  );
}
