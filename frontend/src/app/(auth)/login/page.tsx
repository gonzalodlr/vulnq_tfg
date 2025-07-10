/** @format */
"use client";

import React from "react";
import { Login as LoginComponent } from "@/components/auth/login";
const icon = "/icon.svg";


const Login: React.FC = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-muted">
      <LoginComponent
        logo={{
          url: "/",
          src: icon,
          alt: "VulnQ",
        }}
      />
    </div>
  );
};

export default Login;
