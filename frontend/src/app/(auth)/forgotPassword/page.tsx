/** @format */

"use client";

import React from "react";

import { ForgotPassword as ForgotPasswordComponent } from "@/components/auth/forgot-password";
const icon = "/icon.svg";


const ForgotPassword: React.FC = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-muted">
      <ForgotPasswordComponent
        logo={{
          url: "/",
          src: icon,
          alt: "VulnQ",
        }}
      />
    </div>
  );
};

export default ForgotPassword;
