/** @format */

import React, { Suspense } from "react";
import AssetsPage from "@/components/dashboard/asset/AssetPage";

export default function AssetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          Loading...
        </div>
      }
    >
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <AssetsPage />
          </div>
        </div>
      </div>
    </Suspense>
  );
}
