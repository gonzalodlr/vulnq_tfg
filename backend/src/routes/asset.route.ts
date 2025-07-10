/** @format */

import { Router } from "express";
import * as assetController from "../controllers/asset.controller";
import { assetValidationRules } from "../validators/asset.validator";
import { validate } from "../middlewares/validate";

const assetRoutes = Router();

assetRoutes.get("/get", assetController.getAllAssets);
assetRoutes.get("/get/:id", assetController.getAssetById);
assetRoutes.post(
  "/create",
  assetValidationRules,
  validate,
  assetController.createAsset
);
assetRoutes.put(
  "/update/:id",
  assetValidationRules,
  validate,
  assetController.updateAsset
);
assetRoutes.delete("/delete/:id", assetController.deleteAsset);

export default assetRoutes;
