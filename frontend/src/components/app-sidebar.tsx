/** @format */

"use client";

import * as React from "react";
import {
  IconCamera,
  IconDashboard,
  IconDeviceDesktop,
  IconBug,
  IconFileSettings,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconHelp,
  IconReport,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const icon = {
  src: "/icon.svg",
};
import Image from "next/image";
import Link from "next/link";
import { I18nextProvider, useTranslation } from "react-i18next";
import i18n from "@/i18n/config";

import LangToggle from "@/components/lang-toggle";
import { ToggleTheme } from "@/components/Theme";
import { IUser } from "@/types/IUser";

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: IUser | null }) {
  const { t } = useTranslation();

  const data = {
    user: {
      name: user?.name || "VulnQ User",
      email: user?.email || "example@email.com",
      avatar: user?.name || "VulnQ User",
    },
    navMain: [
      {
        title: t("navMain.dashboard"),
        url: "/dashboard",
        icon: IconDashboard,
      },
      {
        title: t("navMain.assets"),
        url: "/dashboard/asset",
        icon: IconDeviceDesktop,
      },
      {
        title: t("navMain.software"),
        url: "/dashboard/software",
        icon: IconFileSettings,
      },
      {
        title: t("navMain.vulnerabilities"),
        url: "/dashboard/vulnerability",
        icon: IconBug,
      },
      {
        title: t("navMain.team"),
        url: "/dashboard/team",
        icon: IconUsers,
      },
    ],
    navClouds: [
      {
        title: "Capture",
        icon: IconCamera,
        isActive: true,
        url: "#",
        items: [
          {
            title: "Active Proposals",
            url: "#",
          },
          {
            title: "Archived",
            url: "#",
          },
        ],
      },
      {
        title: "Proposal",
        icon: IconFileDescription,
        url: "#",
        items: [
          {
            title: "Active Proposals",
            url: "#",
          },
          {
            title: "Archived",
            url: "#",
          },
        ],
      },
      {
        title: "Prompts",
        icon: IconFileAi,
        url: "#",
        items: [
          {
            title: "Active Proposals",
            url: "#",
          },
          {
            title: "Archived",
            url: "#",
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: t("navSecondary.settings"),
        url: "/dashboard/settings",
        icon: IconSettings,
      },
      {
        title: t("navSecondary.help"),
        url: "/dashboard/help",
        icon: IconHelp,
      },
    ],
    documents: [
      {
        name: t("navDocuments.vulnerabilityDatabase"),
        url: "/dashboard/database",
        icon: IconDatabase,
      },
      {
        name: t("navDocuments.reports"),
        url: "/dashboard/reports",
        icon: IconReport,
      },
    ],
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex justify-between items-center gap-2">
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <Link href="/dashboard" className="flex">
                  <Image
                    src={icon.src}
                    alt="Logo"
                    width={32}
                    height={32}
                    className="h-6 w-6"
                  />
                  <span className="text-base font-semibold">VulnQ</span>
                </Link>
              </SidebarMenuButton>
              <I18nextProvider i18n={i18n}>
                <div className="flex gap-2 group-data-[collapsible=icon]:hidden">
                  <LangToggle />
                  <ToggleTheme />
                </div>
              </I18nextProvider>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
