/** @format */
"use client";
import React, { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n/config";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { fetchUserProfile } from "@/controllers/authController";
import { IUser } from "@/types/IUser";

export default function Page({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);

  useEffect(() => {
    fetchUserProfile()
      .then(setUser)
      .catch((err) => {
        console.error("Error cargando usuario", err);
      });
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" user={user} />
        <SidebarInset>
          <SiteHeader />
          {children}
          <Toaster />
        </SidebarInset>
      </SidebarProvider>
    </I18nextProvider>
  );
}
