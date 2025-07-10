/** @format */

"use client";

import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { IconBell, IconX } from "@tabler/icons-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  fetchNotifications,
  removeNotification,
} from "@/controllers/notificationController";
import { INotification } from "@/types/INotification";

// Iconos de tipo
import { Bug, Cpu } from "lucide-react";
import { IconDeviceDesktop, IconFileSettings } from "@tabler/icons-react";

export function SiteHeader() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement | null>(null);
  const [alerts, setAlerts] = useState<INotification[]>([]);

  // Map de componentes de icono para tipos
  const typeEmojiMap: Record<INotification["type"], string> = {
    risk: "🚨",
    audit: "📋",
    update: "🔄",
    reminder: "⏰",
    info: "ℹ️",
    warning: "⚠️",
  };

  // Map de componentes de icono para categorías
  const categoryIconMap: Record<
    Required<INotification>["category"],
    React.ComponentType<any>
  > = {
    asset: IconDeviceDesktop,
    subasset: IconFileSettings,
    vuln: Bug,
    system: Cpu,
  };

  useEffect(() => {
    (async () => {
      const data = await fetchNotifications();
      setAlerts(data);
    })();
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await removeNotification(id);
      setAlerts((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Error deleting notification", err);
    }
  };

  const pathSegments = pathname?.split("/").filter(Boolean) || [];
  const breadcrumbs = pathSegments.map((seg, i) => ({
    href: "/" + pathSegments.slice(0, i + 1).join("/"),
    label: seg.charAt(0).toUpperCase() + seg.slice(1),
  }));

  // Después de handleDelete, antes del return()
  const groupedAlerts = alerts.reduce((acc, alert) => {
    if (alert.category) {
      (acc[alert.category] ||= []).push(alert);
    }
    return acc;
  }, {} as Record<Required<INotification>["category"], INotification[]>);

  return (
    <header className="flex h-16 items-center px-4 gap-2">
      <SidebarTrigger className="-ml-1" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((bc, i) => (
            <div key={i} className="flex items-center">
              <BreadcrumbLink href={bc.href}>{bc.label}</BreadcrumbLink>
              {i < breadcrumbs.length - 1 && (
                <BreadcrumbSeparator className="mx-2" />
              )}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto relative" ref={bellRef}>
        <Button variant="ghost" onClick={() => setDropdownOpen((o) => !o)}>
          <IconBell className="w-5 h-5" />
          {alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
              {alerts.length}
            </span>
          )}
        </Button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50">
            <div className="max-h-60 overflow-y-auto">
              {Object.entries(groupedAlerts).map(([category, items]) => {
                // ordena descendente
                const sorted = [...items].sort(
                  (a, b) =>
                    new Date(b.createdAt ?? 0).getTime() -
                    new Date(a.createdAt ?? 0).getTime()
                );
                const CategoryIconComp =
                  categoryIconMap[category as keyof typeof categoryIconMap];
                // calcula minutos desde la más reciente
                const now = Date.now();
                const created = new Date(sorted[0].createdAt ?? 0).getTime();
                const diffMin = Math.floor((now - created) / 60000);
                const timeLabel =
                  diffMin < 60
                    ? `${diffMin} min`
                    : `${Math.floor(diffMin / 60)} h`;

                return (
                  <div key={category} className="border-b last:border-none">
                    {/* Header de categoría */}
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800">
                      <CategoryIconComp className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-300" />
                      <span className="font-medium capitalize">
                        {category} • {timeLabel}
                      </span>
                    </div>
                    <ul>
                      {sorted.map((alert) => (
                        <li
                          key={alert.id}
                          className="p-3 flex items-start hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          {/* Icono de tipo */}
                            <span className="mr-2 flex items-center justify-center w-6 h-6 rounded-full text-lg leading-none">
                            {typeEmojiMap[alert.type]}
                            </span>

                          {/* Mensaje y timestamp */}
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {alert.message}
                            </div>
                            {alert.createdAt && (
                              <div className="text-xs text-muted-foreground">
                                {(() => {
                                  const now = new Date();
                                  const created = new Date(alert.createdAt);
                                  const diffMs =
                                    now.getTime() - created.getTime();
                                  const diffSec = Math.floor(diffMs / 1000);
                                  const diffMin = Math.floor(diffSec / 60);
                                  const diffHour = Math.floor(diffMin / 60);
                                  const diffDay = Math.floor(diffHour / 24);

                                  if (diffSec < 60)
                                    return `about ${diffSec} seconds ago`;
                                  if (diffMin < 60)
                                    return `about ${diffMin} minutes ago`;
                                  if (diffHour < 24)
                                    return `about ${diffHour} hours ago`;
                                  /* >24h */ return `about ${diffDay} days ago`;
                                })()}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleDelete(alert.id)}
                            className="ml-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            aria-label="Eliminar notificación"
                          >
                            <IconX className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
