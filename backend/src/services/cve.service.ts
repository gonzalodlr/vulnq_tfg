/** @format */
import CVEAssetReport from "../models/cveAssetReport";

// User
export const getAllCVEs = async (userId: string): Promise<CVEAssetReport[]> => {
  return await CVEAssetReport.findAll({ where: { idClient: userId } });
};

// USER
export const getCVEById = async (
  id: string,
  userId: string
): Promise<CVEAssetReport | null> => {
  return await CVEAssetReport.findOne({ where: { id, idClient: userId } });
};

export const deleteCVE = async (id: string): Promise<boolean> => {
  const deleted = await CVEAssetReport.destroy({ where: { id } });
  return deleted > 0;
};
