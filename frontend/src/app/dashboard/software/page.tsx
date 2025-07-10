/** @format */

import React from "react";
import SoftwaresPage from "@/components/dashboard/software/SoftwarePage";

export default function SoftwarePage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* <DataTable
            data={[
              {
                id_software: "1",
                id_asset: "1",
                software_name: "Software A",
                version: "1.0.0",
                os_host: "Windows",
                vendor: "Vendor A",
              },
              {
                id_software: "2",
                id_asset: "2",
                software_name: "Software B",
                version: "2.0.0",
                os_host: "Linux",
                vendor: "Vendor B",
              },
              {
                id_software: "3",
                id_asset: "3",
                software_name: "Software C",
                version: "3.0.0",
                os_host: "macOS",
                vendor: "Vendor C",
              },
              {
                id_software: "4",
                id_asset: "4",
                software_name: "Software D",
                version: "4.0.0",
                os_host: "Windows",
                vendor: "Vendor D",
              },
              {
                id_software: "5",
                id_asset: "5",
                software_name: "Software E",
                version: "5.0.0",
                os_host: "Linux",
                vendor: "Vendor E",
              },
              {
                id_software: "6",
                id_asset: "6",
                software_name: "Software F",
                version: "6.0.0",
                os_host: "macOS",
                vendor: "Vendor F",
              },
              {
                id_software: "7",
                id_asset: "7",
                software_name: "Software G",
                version: "7.0.0",
                os_host: "Windows",
                vendor: "Vendor G",
              },
              {
                id_software: "8",
                id_asset: "8",
                software_name: "Software H",
                version: "8.0.0",
                os_host: "Linux",
                vendor: "Vendor H",
              },
              {
                id_software: "9",
                id_asset: "9",
                software_name: "Software I",
                version: "9.0.0",
                os_host: "macOS",
                vendor: "Vendor I",
              },
              {
                id_software: "10",
                id_asset: "10",
                software_name: "Software J",
                version: "10.0.0",
                os_host: "Windows",
                vendor: "Vendor J",
              },
              {
                id_software: "11",
                id_asset: "11",
                software_name: "Software K",
                version: "11.0.0",
                os_host: "Linux",
                vendor: "Vendor K",
              },
              {
                id_software: "12",
                id_asset: "12",
                software_name: "Software L",
                version: "12.0.0",
                os_host: "macOS",
                vendor: "Vendor L",
              },
              {
                id_software: "13",
                id_asset: "13",
                software_name: "Software M",
                version: "13.0.0",
                os_host: "Windows",
                vendor: "Vendor M",
              },
              {
                id_software: "14",
                id_asset: "14",
                software_name: "Software N",
                version: "14.0.0",
                os_host: "Linux",
                vendor: "Vendor N",
              },
              {
                id_software: "15",
                id_asset: "15",
                software_name: "Software O",
                version: "15.0.0",
                os_host: "macOS",
                vendor: "Vendor O",
              },
            ]}
          /> */}
          <SoftwaresPage />
        </div>
      </div>
    </div>
  );
}
