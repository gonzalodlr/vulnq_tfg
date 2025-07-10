/** @format */

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mx-auto max-w-5xl text-2xl gap-2 mb-10">
        <Navbar />
      </div>
      <main>{children}</main>
      <div className="mx-auto max-w-5xl text-2xl gap-2 mb-10">
        <Footer />
      </div>
    </>
  );
}
