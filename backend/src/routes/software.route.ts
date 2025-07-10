/** @format */

import { Router } from "express";
import * as softwareController from "../controllers/software.controller";
import { softwareValidationRules } from "../validators/software.validator";
import { validate } from "../middlewares/validate";

const softwareRoutes = Router();

softwareRoutes.get("/get", softwareController.getAllSoftware);
softwareRoutes.get("/get/:id", softwareController.getSoftwareById);
softwareRoutes.post(
  "/create",
  softwareValidationRules,
  validate,
  softwareController.createSoftware
);
softwareRoutes.put(
  "/update/:id",
  softwareValidationRules,
  validate,
  softwareController.updateSoftware
);
softwareRoutes.delete("/delete/:id", softwareController.deleteSoftware);

export default softwareRoutes;
