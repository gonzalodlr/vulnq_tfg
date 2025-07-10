/** @format */

import { Report } from "../models";
import { IReport } from "../interfaces/IReport";
import { ScanResultsProps } from "../interfaces/IScanResults";
import CVEAssetReport from "../models/cveAssetReport";

// Get all reports
//ADMIN
export const getAllReports = async (): Promise<Report[]> => {
  return await Report.findAll();
};
// USER
export const getAllReportsByUser = async (
  userId: string
): Promise<Report[]> => {
  return await Report.findAll({ where: { idClient: userId } });
};

// Get report by ID
// ADMIN
/* export const getReportById = async (id: number): Promise<Report | null> => {
  return await Report.findByPk(id);
}; */

// USER
export const getReportById = async (
  id: string,
  userId: string
): Promise<Report | null> => {
  return await Report.findOne({ where: { id, idClient: userId } });
};

// Create a new report and save CVEs by Asset
export const createReport = async (body: any): Promise<Report> => {
  // Validate the body
  if (!body.idClient || !body.report) {
    throw new Error("Invalid report data");
  }
  // Check if the report already exists for the client
  const existingReports = await Report.findAll({
    where: {
      idClient: body.idClient,
    },
  });
  const newData = body.report as ScanResultsProps;
  if (existingReports.length > 0) {
    // Check the report data
    for (const report of existingReports) {
      if (JSON.stringify(report.data) === JSON.stringify(body.report)) {
        throw new Error("Report already exists for this client");
      } else {
        // If the report data is different, we have to compare the data and add the new data
        const existingData = report.data as ScanResultsProps;

        if (existingData && newData && Array.isArray(newData.results)) {
          // Find only the new elements not present in existingData
          const newElements = newData.results.filter(
            (element) =>
              !(
                Array.isArray(existingData.results) &&
                existingData.results.some(
                  (item) =>
                    item.cve_id === element.cve_id &&
                    item.asset.id === element.asset.id
                )
              )
          );

          if (newElements.length === 0) {
            throw new Error("Report already exists for this client");
          }

          // Create a report object with only the new elements
          const reportWithNewData: IReport = {
            idClient: body.idClient,
            data: {
              ...newData,
              results: newElements,
            },
          };

          const savedReport = await Report.create(reportWithNewData);

          // Save each new CVE in the cveAssetReport table
          for (const element of newElements) {
            const exists = await CVEAssetReport.findOne({
              where: {
                cve_id: element.cve_id,
                asset_id: element.asset.id,
              },
            });
            if (!exists) {
              await CVEAssetReport.create({
                report_id: savedReport.id,
                idClient: body.idClient,
                cve_id: element.cve_id,
                asset_id: element.asset.id,
                full_json: element,
              });
            }
          }
          

          return savedReport;
        } else {
          throw new Error("Invalid report data format");
        }
      }
    }
  }

  // Save all the report data
  const report: IReport = {
    idClient: body.idClient,
    data: body.report,
  };
  const savedReport = await Report.create(report);

  // Save each CVE in the cveAssetReport table
  const scan = body.report as ScanResultsProps;
  if (scan && Array.isArray(scan.results)) {
    for (const element of scan.results) {
      const exists = await CVEAssetReport.findOne({
        where: {
          cve_id: element.cve_id,
          asset_id: element.asset.id,
        },
      });
      if (!exists) {
        await CVEAssetReport.create({
          report_id: savedReport.id,
          idClient: body.idClient,
          cve_id: element.cve_id,
          asset_id: element.asset.id,
          full_json: element,
        });
      }
    }
  }

  return savedReport;
};

// Update a report
export const updateReport = async (
  id: string,
  data: Partial<IReport>
): Promise<boolean> => {
  const [updated] = await Report.update(data, { where: { id } });
  return updated > 0;
};

// Delete a report
export const deleteReport = async (id: string): Promise<boolean> => {
  const deleted = await Report.destroy({ where: { id } });
  return deleted > 0;
};
