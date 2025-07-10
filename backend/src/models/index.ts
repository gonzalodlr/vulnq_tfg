/** @format */

import { sequelize } from "../config/db";
import { initAssetModel, Asset } from "./asset.model";
import { initReportModel, Report } from "./report.model";
import { initSoftwareModel, Software } from "./software.model";
import { initUserModel, User } from "./user.model";

initUserModel(sequelize);
initAssetModel(sequelize);
initSoftwareModel(sequelize);
initReportModel(sequelize);

// Asset hasMany Software
Asset.hasMany(Software, {
  foreignKey: "id_asset",
  sourceKey: "id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Software belongsTo Asset
Software.belongsTo(Asset, {
  foreignKey: "id_asset",
  targetKey: "id",
});

// User hasMany Asset (por idClient en Asset)
User.hasMany(Asset, {
  foreignKey: "idClient",
  sourceKey: "id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Asset belongsTo User
Asset.belongsTo(User, {
  foreignKey: "idClient",
  targetKey: "id",
});

export { sequelize, User, Asset, Software, Report };
