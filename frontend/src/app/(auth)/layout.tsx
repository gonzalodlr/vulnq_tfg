/** @format */

import React from "react";
import NavbarSecondary from "@/components/layout/navbar-secondary";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavbarSecondary />
      <main>{children}</main>
    </>
  );
}
