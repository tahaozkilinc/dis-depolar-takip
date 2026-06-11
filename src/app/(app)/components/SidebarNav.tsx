"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/lib/types";
import { signOut } from "../actions";
import packageJson from "../../../../package.json";

const APP_VERSION = packageJson.version;

interface NavItem {
  href: string;
  label: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["admin", "depo", "viewer", "operasyon_takip"] },
  { href: "/stok-girisi", label: "Stok Girişi", roles: ["admin", "depo", "viewer", "operasyon"] },
  { href: "/tasima-girisi", label: "Taşıma Girişi", roles: ["admin", "depo", "viewer", "operasyon_takip"] },
  { href: "/tasimalar", label: "Taşımalar (Tonaj Listesi)", roles: ["admin", "depo", "viewer", "operasyon_takip"] },
  { href: "/maliyetler/depolama", label: "Depolama Maliyeti", roles: ["admin", "viewer"] },
  { href: "/maliyetler/nakliye", label: "Nakliye Maliyeti", roles: ["admin", "viewer"] },
  { href: "/depolar", label: "Depolar", roles: ["admin", "viewer", "operasyon"] },
  { href: "/urunler", label: "Ürünler & Varış Noktaları", roles: ["admin", "viewer"] },
  { href: "/nakliyeciler", label: "Nakliyeciler", roles: ["admin", "viewer"] },
  { href: "/fiyat-anlasmalari", label: "Fiyat Anlaşmaları", roles: ["admin", "viewer"] },
  { href: "/depolama-ucretleri", label: "Depolama Ücretleri", roles: ["admin", "viewer", "operasyon"] },
  { href: "/kullanicilar", label: "Kullanıcılar", roles: ["admin"] },
];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Yönetici",
  depo: "Depo Kullanıcısı",
  viewer: "Görüntüleyici",
  operasyon: "Operasyon (Stok)",
  operasyon_takip: "Operasyon Takip",
};

export default function SidebarNav({
  role,
  fullName,
  children,
}: {
  role: UserRole;
  fullName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm md:hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-md border px-3 py-1.5 text-sm"
          aria-label="Menüyü aç/kapat"
        >
          ☰
        </button>
        <span className="text-sm font-semibold">Dış Depolar Takip</span>
        <span className="w-8" />
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`${
            open ? "block" : "hidden"
          } w-full border-b bg-white md:block md:w-64 md:shrink-0 md:border-b-0 md:border-r md:min-h-screen`}
        >
          <div className="hidden border-b p-4 md:block">
            <Image src="/sunar-logo.svg" alt="Sunar" width={140} height={62} priority />
            <p className="mt-1 text-sm font-semibold text-brand-600">
              Dış Depolar Takip
            </p>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            {items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-3 md:hidden">
            <div className="mb-2 px-1 text-sm">
              <div className="font-medium">{fullName}</div>
              <div className="text-gray-500">
                {ROLE_LABELS[role]}
              </div>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="w-full rounded-md border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Çıkış Yap
              </button>
            </form>
          </div>
          <div className="hidden border-t px-4 py-2 text-xs text-gray-400 md:block">
            v{APP_VERSION}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Desktop top bar */}
          <header className="hidden items-center justify-between border-b bg-white px-6 py-3 shadow-sm md:flex">
            <div />
            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <div className="font-medium">{fullName}</div>
                <div className="text-gray-500">
                  {ROLE_LABELS[role]}
                </div>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-md border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Çıkış Yap
                </button>
              </form>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 md:px-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
