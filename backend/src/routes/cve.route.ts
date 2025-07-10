/** @format */

import { Router } from "express";
import * as cveController from "../controllers/cve.controller";

const cveRoutes = Router();

cveRoutes.get("/get", cveController.getAllCVEs);
cveRoutes.get("/get/:id", cveController.getCVEById);
cveRoutes.delete("/delete/:id", cveController.deleteCVE);

export default cveRoutes;
