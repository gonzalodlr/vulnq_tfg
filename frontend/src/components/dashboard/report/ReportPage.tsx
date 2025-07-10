/** @format */

"use client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { IconDotsVertical } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IReport } from "@/types/IReport";
import { fetchReports } from "@/controllers/reportsController";
import { formatDate } from "@/lib/formDate";

export default function ReportPage() {
  const { t } = useTranslation();

  const [reports, setReports] = useState<IReport[]>([]);
  const [filteredItems, setFilteredItems] = useState<IReport[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const reportsData = await fetchReports();
      console.log("Assets reportsData:", reportsData);
      setReports(reportsData);
      setFilteredItems(reportsData);
    };
    fetchData();
  }, []);

  const filterItems = (searchItem: string) => {
    const filtered = reports.filter((report) =>
      (report.createdAt || "").toLowerCase().includes(searchItem.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  function confirmDelete(id_report: string): void {
    toast(
      <div className="flex flex-col">
        <strong className="text-warning mb-2">⚠️ Confirm Deletion</strong>
        <p className="mb-4">
          Are you sure you want to delete this report? This action cannot be
          undone.
        </p>
        <Button
          variant="destructive"
          onClick={() => {
            handleDelete(id_report);
            toast.dismiss();
          }}
          className="w-full"
        >
          Confirm
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.dismiss()}
          className="mt-2 w-full"
        >
          Undo
        </Button>
      </div>,
      {
        duration: 10000,
        description: "This action cannot be undone.",
        style: {
          backgroundColor: "#fff3cd",
          color: "#856404",
          border: "1px solid #ffeeba",
        },
        dismissible: true,
        position: "top-center",
        className: "bg-yellow-50 border border-yellow-400",
      }
    );
  }

  function handleDelete(id_report: string): void {
    const updated = reports.filter((item) => item.id !== id_report);
    setReports(updated);
    setFilteredItems(updated);
    toast(
      <div>
        <strong>Report deleted</strong>
        <p>The report has been removed successfully.</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-md shadow-md">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Reports</h1>
            <Badge className="ml-2">{reports.length}</Badge>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search reports..."
                className="pl-8 w-full"
                onChange={(e) => filterItems(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-medium">ID</th>
                  <th className="p-3 text-left font-medium">Client</th>
                  <th className="p-3 text-left font-medium">Created At</th>
                  <th className="p-3 text-left font-medium">Total CVEs</th>
                  <th className="p-3 text-left font-medium">Total Assets</th>
                  <th className="p-3 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((report: IReport) => (
                  <tr key={report.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">
                      <span
                        className="font-mono text-base cursor-pointer hover:underline"
                        onClick={() =>
                          window.open(
                            `/dashboard/reports/${report.id}`,
                            "_blank",
                            "noopener,noreferrer"
                          )
                        }
                        tabIndex={0}
                        role="button"
                        aria-label={`Open details for ${report.id}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            window.open(
                              `/dashboard/reports/${report.id}`,
                              "_blank",
                              "noopener,noreferrer"
                            );
                          }
                        }}
                      >
                        {report.id || "Empty"}
                      </span>
                    </td>
                    <td className="p-3 font-medium">
                      {report.idClient || "Empty"}
                    </td>
                    <td className="p-3">{formatDate(report.createdAt)}</td>
                    <td className="p-3">
                      {Array.isArray(
                        (report.data as { results?: unknown[] })?.results
                      )
                        ? (report.data as { results?: unknown[] }).results
                            ?.length ?? 0
                        : 0}
                    </td>
                    <td className="p-3">
                      {Array.isArray(
                        (report.data as { results?: any[] })?.results
                      )
                        ? Array.from(
                            new Set(
                              (
                                (report.data as { results?: any[] }).results ??
                                []
                              )
                                .map((item) => item.asset?.id)
                                .filter(Boolean)
                            )
                          ).length
                        : 0}
                    </td>

                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <IconDotsVertical />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => confirmDelete(report.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {reports.length} of {reports.length} reports
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="bg-gray-100">
              1
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
