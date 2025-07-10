/** @format */

import { Request, Response } from "express";
import * as softwareService from "../services/software.service";
import { ISession } from "../interfaces/ISession";

// Admin
/* export const getAllSoftware = async (_req: Request, res: Response) => {
  const software = await softwareService.getAllSoftware();
  res.json(software);
}; */

// User
export const getAllSoftware = async (req: Request, res: Response) => {
  const session = req.headers.session as ISession | undefined;
  const userId = session?.userId;
  if (!userId) {
    res.status(401).send("Unauthorized");
    return;
  }
  const software = await softwareService.getAllSoftware(userId);
  res.json(software);
};

export const getSoftwareById = async (req: Request, res: Response) => {
  // Check if the user is authorized
  const session = req.headers.session as ISession | undefined;
  const userId = session?.userId;
  if (!userId) {
    res.status(401).send("Unauthorized");
    return;
  }

  const item = await softwareService.getSoftwareById(req.params.id);
  item ? res.json(item) : res.status(404).send("Software not found");
};

export const createSoftware = async (req: Request, res: Response) => {
  const item = await softwareService.createSoftware(req.body);
  res.status(201).json(item);
};

export const updateSoftware = async (req: Request, res: Response) => {
  const success = await softwareService.updateSoftware(req.params.id, req.body);
  success ? res.sendStatus(204) : res.status(404).send("Software not found");
};

export const deleteSoftware = async (req: Request, res: Response) => {
  const success = await softwareService.deleteSoftware(req.params.id);
  success ? res.sendStatus(204) : res.status(404).send("Software not found");
};
