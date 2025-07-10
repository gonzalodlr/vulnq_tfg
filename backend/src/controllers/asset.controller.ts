/** @format */

import { Request, Response } from "express";
import * as assetService from "../services/asset.service";
import { ISession } from "../interfaces/ISession";

// Admin Controller
/* export const getAllAssets = async (req: Request, res: Response) => {
  const assets = await assetService.getAllAssets();
  res.json(assets);
}; */

// User Controller
export const getAllAssets = async (req: Request, res: Response) => {
  const session = req.headers.session as ISession | undefined;
  const userId = session?.userId;
  if (!userId) {
    res.status(401).send("Unauthorized");
    return;
  }
  const assets = await assetService.getAllAssets(userId);
  res.json(assets);
};

export const getAssetById = async (req: Request, res: Response) => {
  // Check if the user is authorized
  const session = req.headers.session as ISession | undefined;
  const userId = session?.userId;
  if (!userId) {
    res.status(401).send("Unauthorized");
    return;
  }
  const asset = await assetService.getAssetById(req.params.id, userId);
  asset ? res.json(asset) : res.status(404).send("Asset not found");
};

export const createAsset = async (req: Request, res: Response) => {
  const session = req.headers.session as ISession | undefined;
  // Add userId to the asset data body if session exists
  req.body.idClient = session?.userId;

  const asset = await assetService.createAsset(req.body);
  res.status(201).json(asset);
};

export const updateAsset = async (req: Request, res: Response) => {
  const success = await assetService.updateAsset(req.params.id, req.body);
  success ? res.sendStatus(204) : res.status(404).send("Asset not found");
};

export const deleteAsset = async (req: Request, res: Response) => {
  const success = await assetService.deleteAsset(req.params.id);
  success ? res.sendStatus(204) : res.status(404).send("Asset not found");
};
