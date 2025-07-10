/** @format */

"use client";
import React from "react";
import { useTranslation } from "react-i18next";

const Home: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="home-page">
      <div className="flex flex-col items-center justify-center min-h-screen p-6 ">
        <div className="max-w-4xl shadow-lg rounded-lg p-8 shadow-md">
          <h1 className="text-3xl font-bold mb-4">Welcome to Our Platform</h1>
          <p className=" mb-6">
            This is a simple React application demonstrating the use of Tailwind
            CSS for styling.
          </p>
          <p className=" mb-6">
            Explore our features and enjoy your experience!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
