/** @format */
"use client";

import React from "react";

import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n/config";

import LangToggle from "../lang-toggle";
import { ToggleTheme } from "../Theme";

const NavbarSecondary = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <div className="flex justify-center items-center gap-2 py-2 bg-muted">
        <div>
          <LangToggle />
        </div>
        <div>
          <ToggleTheme />
        </div>
      </div>
    </I18nextProvider>
  );
};

export default NavbarSecondary;
