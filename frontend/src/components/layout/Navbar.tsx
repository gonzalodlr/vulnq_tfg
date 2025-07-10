/** @format */

"use client";
import React from "react";
import Image from "next/image";

import { I18nextProvider, useTranslation } from "react-i18next";
import i18n from "@/i18n/config";
import { Book, Menu, Sunset, Trees, Zap } from "lucide-react";
import { ToggleTheme } from "@/components/Theme";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const icon = "/icon.svg";

import LangToggle from "../lang-toggle";
import Link from "next/link";

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

interface NavbarProps {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  menu?: MenuItem[];
  auth?: {
    login: {
      title: string;
      url: string;
    };
    signup: {
      title: string;
      url: string;
    };
  };
}

const Navbar = ({ logo, menu, auth }: NavbarProps) => {
  const { t } = useTranslation();
  const translatedLogo = {
    url: "/",
    src: icon,
    alt: "logo",
    title: t("logo.title"),
  };
  const translatedMenu: MenuItem[] = [
    { title: t("menu.home"), url: "#" },
    {
      title: t("menu.products"),
      url: "#",
      items: [
        {
          title: t("menu.blog"),
          description: "The latest industry news, updates, and info",
          icon: <Book className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: t("menu.company"),
          description: "Our mission is to innovate and empower the world",
          icon: <Trees className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: t("menu.careers"),
          description: "Browse job listing and discover our workspace",
          icon: <Sunset className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: t("menu.support"),
          description:
            "Get in touch with our support team or visit our community forums",
          icon: <Zap className="size-5 shrink-0" />,
          url: "#",
        },
      ],
    },
    { title: t("menu.pricing"), url: "#" },
    { title: t("menu.blog"), url: "#" },
  ];

  const translatedAuth = {
    login: { title: t("auth.login"), url: "/login" },
    signup: { title: t("auth.signup"), url: "/signup" },
  };
  return (
    <I18nextProvider i18n={i18n}>
      <section className="py-4">
        <div className="container">
          {/* Desktop Menu */}
          <nav className="hidden justify-between lg:flex">
            <div className="flex items-center gap-6">
              {/* Logo */}
              <Link
                href={translatedLogo.url}
                className="flex items-center gap-2"
              >
                <Image
                  src={translatedLogo.src}
                  className="max-h-8"
                  alt={translatedLogo.alt}
                  width={32}
                  height={32}
                />
                <span className="text-lg font-semibold tracking-tighter">
                  {translatedLogo.title}
                </span>
              </Link>
              <div className="flex items-center">
                <NavigationMenu>
                  <NavigationMenuList>
                    {translatedMenu.map((item) => renderMenuItem(item))}
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            </div>
            <div className="flex gap-2">
              <div>
                <Button asChild variant="outline" size="sm">
                  <Link href={translatedAuth.login.url}>
                    {translatedAuth.login.title}
                  </Link>
                </Button>
              </div>
              <div>
                <Button asChild size="sm">
                  <Link href={translatedAuth.signup.url}>
                    {translatedAuth.signup.title}
                  </Link>
                </Button>
              </div>
              <div>
                <LangToggle />
              </div>
              <ToggleTheme />
            </div>
          </nav>

          {/* Mobile Menu */}
          <div className="block lg:hidden">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link
                href={translatedLogo.url}
                className="flex items-center gap-2"
              >
                <Image
                  src={translatedLogo.src}
                  className="max-h-8"
                  alt={translatedLogo.alt}
                  width={32}
                  height={32}
                />
              </Link>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>
                      <Link
                        href={translatedLogo.url}
                        className="flex items-center gap-2"
                      >
                        <Image
                          src={translatedLogo.src}
                          className="max-h-8"
                          alt={translatedLogo.alt}
                          width={32}
                          height={32}
                        />
                      </Link>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-6 p-4">
                    <Accordion
                      type="single"
                      collapsible
                      className="flex w-full flex-col gap-4"
                    >
                      {translatedMenu.map((item) => renderMobileMenuItem(item))}
                    </Accordion>

                    <div className="flex flex-col gap-3">
                      <Button asChild variant="outline">
                        <Link href={translatedAuth.login.url}>
                          {translatedAuth.login.title}
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link href={translatedAuth.signup.url}>
                          {translatedAuth.signup.title}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </section>
    </I18nextProvider>
  );
};

const renderMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent className="bg-popover text-popover-foreground">
          {item.items.map((subItem) => (
            <NavigationMenuLink asChild key={subItem.title} className="w-80">
              <SubMenuLink item={subItem} />
            </NavigationMenuLink>
          ))}
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink
        href={item.url}
        className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-accent-foreground"
      >
        {item.title}
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <SubMenuLink key={subItem.title} item={subItem} />
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <Link key={item.title} href={item.url} className="text-md font-semibold">
      {item.title}
    </Link>
  );
};

const SubMenuLink = ({ item }: { item: MenuItem }) => {
  return (
    <Link
      className="flex flex-row gap-4 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-muted hover:text-accent-foreground"
      href={item.url}
    >
      <div className="text-foreground">{item.icon}</div>
      <div>
        <div className="text-sm font-semibold">{item.title}</div>
        {item.description && (
          <p className="text-sm leading-snug text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
};

export { Navbar };
