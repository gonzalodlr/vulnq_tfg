/** @format */

import React from "react";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-4xl bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Terms and Conditions
        </h1>
        <p className="text-gray-600 mb-6">
          Welcome to our Vulnerability Management System for Technological
          Enterprise Assets. By using our platform, you agree to the following
          terms and conditions. Please read them carefully.
        </p>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          1. Use of the System
        </h2>
        <p className="text-gray-600 mb-4">
          The system is designed to help enterprises manage and mitigate
          vulnerabilities in their technological assets. Unauthorized use or
          access is strictly prohibited.
        </p>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          2. Data Privacy
        </h2>
        <p className="text-gray-600 mb-4">
          We prioritize the security and privacy of your data. By using this
          system, you consent to the collection and processing of data as
          outlined in our Privacy Policy.
        </p>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          3. Limitation of Liability
        </h2>
        <p className="text-gray-600 mb-4">
          We are not liable for any damages resulting from the use of this
          system. Users are responsible for ensuring the accuracy and security
          of their data.
        </p>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          4. Changes to Terms
        </h2>
        <p className="text-gray-600 mb-4">
          We reserve the right to update these terms at any time. Continued use
          of the system constitutes acceptance of the updated terms.
        </p>
        <p className="text-gray-600">
          If you have any questions or concerns, please contact our support
          team.
        </p>
        <div className="mt-6">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Accept Terms
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
