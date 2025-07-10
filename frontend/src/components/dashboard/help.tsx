/** @format */
"use client";
import React from "react";
import { useTranslation } from "react-i18next";

export function Help({ ...props }) {
  const { t } = useTranslation();

  return (
    <>
      <div {...props}>
        <div className="flex flex-col items-center justify-center h-full p-4">
          <h1 className="text-2xl font-bold mb-4">{t("help.title")}</h1>
          <input
            type="text"
            placeholder={t("help.placeholder")}
            className="w-100 p-2 border border-gray-300 rounded-lg mb-4"
          />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center mt-6 space-y-4">
        <button className="w-100 p-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600">
          {t("help.faq")}
        </button>
        <button className="w-100 p-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600">
          {t("help.contactSupport")}
        </button>
        <button className="w-100 p-2 bg-purple-500 text-white rounded-lg shadow hover:bg-purple-600">
          {t("help.documentation")}
        </button>
        <button className="w-100 p-2 bg-yellow-500 text-white rounded-lg shadow hover:bg-yellow-600">
          {t("help.community")}
        </button>
      </div>
    </>
  );
}
