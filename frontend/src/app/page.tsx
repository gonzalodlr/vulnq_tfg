/** @format */
"use client";
import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Home from "@/components/home";

// Pagina de inicio
const App: React.FC = () => {
  return (
    <React.StrictMode>
      <div className="mx-auto max-w-5xl text-2xl gap-2 mb-10">
        <Navbar />
        <Home />
        <Footer />
      </div>
    </React.StrictMode>
  );
};

export default App;
