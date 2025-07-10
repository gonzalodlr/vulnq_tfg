/** @format */

import { Asset } from "../models";
import { IAsset } from "../interfaces/IAsset";

// Admin
/* export const getAllAssets = async (): Promise<Asset[]> => {
  return await Asset.findAll();
}; */
// User
export const getAllAssets = async (userId: string): Promise<Asset[]> => {
  return await Asset.findAll({ where: { idClient: userId } });
};

// USER
export const getAssetById = async (
  id: string,
  userId: string
): Promise<Asset | null> => {
  return await Asset.findOne({ where: { id, idClient: userId } });
};

export const createAsset = async (data: IAsset): Promise<Asset> => {
  delete data.id;
  return await Asset.create(data);
};

export const updateAsset = async (
  id: string,
  data: Partial<IAsset>
): Promise<boolean> => {
  const [updated] = await Asset.update(data, { where: { id } });
  return updated > 0;
};

export const deleteAsset = async (id: string): Promise<boolean> => {
  const deleted = await Asset.destroy({ where: { id } });
  return deleted > 0;
};
