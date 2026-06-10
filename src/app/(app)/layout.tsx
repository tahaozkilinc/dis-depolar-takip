import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SidebarNav from "./components/SidebarNav";
import type { Profile } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  // Middleware already verified the session with Supabase Auth on this
  // request, so reading it from the local cookie here avoids a second
  // network round-trip to the auth server on every navigation.
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

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-lg border bg-white p-6 text-center shadow-sm">
          <h1 className="mb-2 text-lg font-semibold text-gray-900">
            Profiliniz oluşturuluyor
          </h1>
          <p className="text-sm text-gray-600">
            Profiliniz oluşturuluyor, lütfen sayfayı yenileyin.
          </p>
        </div>
      </div>
    );
  }

  if (!profile.active) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-lg border bg-white p-6 text-center shadow-sm">
          <h1 className="mb-2 text-lg font-semibold text-gray-900">
            Hesabınız pasif
          </h1>
          <p className="text-sm text-gray-600">
            Hesabınız henüz aktif değil. Lütfen yöneticinizle iletişime
            geçin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarNav
      role={profile.role}
      fullName={profile.full_name ?? "Kullanıcı"}
    >
      {children}
    </SidebarNav>
  );
}
