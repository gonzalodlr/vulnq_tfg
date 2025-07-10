/** @format */

import React from "react";

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Privacy Policy
        </h1>
        <p className="text-gray-600 mb-4">
          At [Your Company Name], we are committed to protecting your privacy
          and ensuring the security of your personal information. This Privacy
          Policy outlines the rules and practices we follow to safeguard your
          data.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
          1. Information We Collect
        </h2>
        <p className="text-gray-600 mb-4">
          We may collect personal information such as your name, email address,
          phone number, and payment details when you interact with our services.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
          2. How We Use Your Information
        </h2>
        <ul className="list-disc list-inside text-gray-600 mb-4">
          <li>To provide and improve our services.</li>
          <li>To communicate with you regarding updates and promotions.</li>
          <li>To ensure compliance with legal obligations.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
          3. Data Security
        </h2>
        <p className="text-gray-600 mb-4">
          We implement industry-standard security measures to protect your data
          from unauthorized access, alteration, or disclosure.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
          4. Sharing Your Information
        </h2>
        <p className="text-gray-600 mb-4">
          We do not sell or share your personal information with third parties,
          except as required by law or with your explicit consent.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
          5. Your Rights
        </h2>
        <ul className="list-disc list-inside text-gray-600 mb-4">
          <li>Access your personal data.</li>
          <li>Request corrections to inaccurate information.</li>
          <li>Request deletion of your data, subject to legal obligations.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
          6. Updates to This Policy
        </h2>
        <p className="text-gray-600 mb-4">
          We may update this Privacy Policy from time to time. Any changes will
          be posted on this page with an updated effective date.
        </p>

        <p className="text-gray-600 mt-6">
          If you have any questions or concerns about our Privacy Policy, please
          contact us at{" "}
          <span className="text-blue-600">privacy@[yourcompany].com</span>.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
