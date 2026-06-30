"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { Activity, AlertTriangle, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterBar } from "@/components/dashboard/filter-bar";

const links = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/alerts", label: "Alert Priority", icon: AlertTriangle }
];

export function DashboardFrame({
  children,
  title,
  subtitle,
  showMetric = true,
  machineIdLocked = false
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  showMetric?: boolean;
  machineIdLocked?: boolean;
}) {
  const pathname = usePathname();

  return (
    <main className="mx-auto min-h-screen max-w-[1800px] px-4 py-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 2xl:py-8">
      <section className="surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap gap-3">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href as Route}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
                      pathname.startsWith(link.href)
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href={"/machines/w-rbt-651" as Route}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
                  pathname.startsWith("/machines/")
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Activity className="h-4 w-4" />
                Machine Detail
              </Link>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-base text-slate-600">{subtitle}</p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <FilterBar showMetric={showMetric} machineIdLocked={machineIdLocked} />
      </section>

      <section className="mt-6">{children}</section>
    </main>
  );
}
