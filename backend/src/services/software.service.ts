/** @format */

import { Asset, Software } from "../models";
import { ISoftware } from "../interfaces/ISoftware";
import { getAllAssets } from "./asset.service";

// Admin
/* export const getAllSoftware = async (): Promise<Software[]> => {
  return await Software.findAll();
}; */

// User
export const getAllSoftware = async (userId: string): Promise<Software[]> => {
  // Fetch all assets for the user
  // and then return the software associated with those assets
  const assets = await getAllAssets(userId);
  if (assets.length === 0) {
    return [];
  }
  // For each asset, find the software associated with it
  const softwarePromises = assets.map((asset) =>
    Software.findAll({ where: { id_asset: asset.dataValues.id } })
  );

  const softwareResults = await Promise.all(softwarePromises);
  //console.log("Software results:", softwareResults);
  // Flatten the array of arrays into a single array
  return softwareResults.flat();
};

export const getSoftwareById = async (
  id_software: string
): Promise<Software | null> => {
  return await Software.findByPk(id_software);
};

export const createSoftware = async (data: ISoftware): Promise<Software> => {
  delete data.id_software;
  return await Software.create(data);
};

export const updateSoftware = async (
  id_software: string,
  data: Partial<ISoftware>
): Promise<boolean> => {
  const [updated] = await Software.update(data, { where: { id_software } });
  return updated > 0;
};

export const deleteSoftware = async (id_software: string): Promise<boolean> => {
  const deleted = await Software.destroy({ where: { id_software } });
  return deleted > 0;
};
