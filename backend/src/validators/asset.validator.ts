/** @format */

import { body } from "express-validator";

export const assetValidationRules = [
  body("name").isString().notEmpty(),
  body("type").isString().notEmpty(),
];
