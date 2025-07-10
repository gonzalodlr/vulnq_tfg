/** @format */

import { Router } from "express";
import * as reportController from "../controllers/report.controller";

const reportRoutes = Router();

reportRoutes.get("/get", reportController.getAllReports);
reportRoutes.get("/get/:id", reportController.getReportById);
reportRoutes.post("/create", reportController.createReport);
//reportRoutes.put("/update/:id", reportController.updateReport);
reportRoutes.delete("/delete/:id", reportController.deleteReport);

export default reportRoutes;
