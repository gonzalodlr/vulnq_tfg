/** @format */

import {
  getReports,
  getReportById,
  deleteReport,
} from "@/services/reportsService";
import { IReport } from "@/types/IReport";

export async function fetchReports(): Promise<IReport[]> {
  return await getReports();
}

export async function fetchReportById(id: string) {
  return await getReportById(id);
}

export async function removeReport(id: string) {
  return await deleteReport(id);
}
