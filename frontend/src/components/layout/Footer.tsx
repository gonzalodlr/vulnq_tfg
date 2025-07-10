/** @format */
"use client";
import React from "react";
import Image from "next/image";

import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
const icon = "/icon.svg";

import { useTranslation } from "react-i18next";
import Link from "next/link";

const sections = [
  {
    title: "Product",
    links: [
      { name: "Overview", href: "#" },
      { name: "Pricing", href: "#" },
      { name: "Marketplace", href: "#" },
      { name: "Features", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "#" },
      { name: "Team", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Careers", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Help", href: "#" },
      { name: "Sales", href: "#" },
      { name: "Advertise", href: "#" },
      { name: "Privacy", href: "#" },
    ],
  },
];

interface FooterProps {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
}
const Footer = ({
  logo = {
    url: "/",
    src: icon,
    alt: "logo",
    title: "VulnQ",
  },
}: FooterProps) => {
  const { t } = useTranslation();

  return (
    <section className="py-32">
      <div className="container">
        <footer>
          <div className="flex flex-col items-start justify-between gap-10 text-center lg:flex-row lg:text-left">
            <div className="flex w-full max-w-96 shrink flex-col items-center justify-between gap-6 lg:items-start">
              {/* Logo */}
              <div className="flex items-center gap-2 lg:justify-start">
                <Link href="/">
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    title={logo.title}
                    className="h-8"
                    width={32}
                    height={32}
                  />
                </Link>
                <h2 className="text-xl font-semibold">{logo.title}</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("footer_description")}
              </p>
              <ul className="flex items-center space-x-6 text-muted-foreground">
                <li className="font-medium hover:text-primary">
                  <Link href="#">
                    <FaInstagram className="size-6" />
                  </Link>
                </li>
                <li className="font-medium hover:text-primary">
                  <Link href="#">
                    <FaFacebook className="size-6" />
                  </Link>
                </li>
                <li className="font-medium hover:text-primary">
                  <Link href="#">
                    <FaTwitter className="size-6" />
                  </Link>
                </li>
                <li className="font-medium hover:text-primary">
                  <Link href="#">
                    <FaLinkedin className="size-6" />
                  </Link>
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-3 gap-6 lg:gap-20">
              {sections.map((section, sectionIdx) => (
                <div key={sectionIdx}>
                  <h3 className="mb-6 font-bold">{section.title}</h3>
                  <ul className="space-y-4 text-sm text-muted-foreground">
                    {section.links.map((link, linkIdx) => (
                      <li
                        key={linkIdx}
                        className="font-medium hover:text-primary"
                      >
                        <Link href={link.href}>{link.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-20 flex flex-col justify-between gap-4 border-t pt-8 text-center text-sm font-medium text-muted-foreground lg:flex-row lg:items-center lg:text-left">
            <p>{t("footer_copyright")}</p>
            <ul className="flex justify-center gap-4 lg:justify-start">
              <li className="hover:text-primary">
                <Link href="/terms">{t("footer_terms")}</Link>
              </li>
              <li className="hover:text-primary">
                <Link href="/privacy">{t("footer_privacy")} </Link>
              </li>
            </ul>
          </div>
        </footer>
      </div>
    </section>
  );
};

export { Footer };
