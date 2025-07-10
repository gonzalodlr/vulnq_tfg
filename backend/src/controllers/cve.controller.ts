/** @format */
import { Request, Response } from "express";
import * as cveService from "../services/cve.service";
import { ISession } from "../interfaces/ISession";

// User Controller
export const getAllCVEs = async (req: Request, res: Response) => {
  const session = req.headers.session as ISession | undefined;
  const userId = session?.userId;
  if (!userId) {
    res.status(401).send("Unauthorized");
    return;
  }
  const CVEs = await cveService.getAllCVEs(userId);
  res.json(CVEs);
};

export const getCVEById = async (req: Request, res: Response) => {
  const session = req.headers.session as ISession | undefined;
  const userId = session?.userId;
  if (!userId) {
    res.status(401).send("Unauthorized");
    return;
  }
  const CVE = await cveService.getCVEById(req.params.id, userId);
  CVE ? res.json(CVE) : res.status(404).send("CVE not found");
};

export const deleteCVE = async (req: Request, res: Response) => {
  const success = await cveService.deleteCVE(req.params.id);
  success ? res.sendStatus(204) : res.status(404).send("CVE not found");
};
