/** @format */

import { body } from "express-validator";

export const softwareValidationRules = [
  body("id_asset").isString().notEmpty(),
  body("software_name").isString().notEmpty(),
  body("version").isString().notEmpty(),
];
