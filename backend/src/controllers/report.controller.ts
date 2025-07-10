/** @format */

import { Request, Response } from "express";
import * as reportService from "../services/report.service";
import { ISession } from "../interfaces/ISession";

/** @format */

// User Controller
export const getAllReports = async (req: Request, res: Response) => {
  const session = req.headers.session as ISession | undefined;
  const userId = session?.userId;
  if (!userId) {
    res.status(401).send("Unauthorized");
    return;
  }
  const reports = await reportService.getAllReportsByUser(userId);
  res.json(reports);
};

export const getReportById = async (req: Request, res: Response) => {
  const session = req.headers.session as ISession | undefined;
  const userId = session?.userId;
  if (!userId) {
    res.status(401).send("Unauthorized");
    return;
  }
  const report = await reportService.getReportById(req.params.id, userId);
  report ? res.json(report) : res.status(404).send("Report not found");
};

export const createReport = async (req: Request, res: Response) => {
  const session = req.headers.session as ISession | undefined;
  if (!session?.userId) {
    res.status(401).json({ error: "Unauthorized: no session" });
    return;
  }
  req.body.idClient = session?.userId;

  try {
    const report = await reportService.createReport(req.body);
    res.status(201).json(report);
  } catch (error: any) {
    if (error.message === "Report already exists for this client") {
      res.status(409).json({ error: error.message });
      return;
    }
    if (error.message === "Invalid report data format") {
      res.status(400).json({ error: error.message });
      return;
    }

    console.error("Error creating report:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

export const updateReport = async (req: Request, res: Response) => {
  const success = await reportService.updateReport(req.params.id, req.body);
  success ? res.sendStatus(204) : res.status(404).send("Report not found");
};

export const deleteReport = async (req: Request, res: Response) => {
  const success = await reportService.deleteReport(req.params.id);
  success ? res.sendStatus(204) : res.status(404).send("Report not found");
};
