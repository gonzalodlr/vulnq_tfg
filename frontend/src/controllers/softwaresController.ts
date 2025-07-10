/** @format */

import {
  postSoftware,
  getSoftwares,
  getSoftwareById,
  deleteSoftware,
} from "@/services/softwareService";
import { ISoftware } from "@/types/ISoftware";

export async function createSoftware(software: ISoftware) {
  return await postSoftware(software);
}

export async function fetchSoftwares(): Promise<ISoftware[]> {
  return await getSoftwares();
}

export async function fetchSoftwareByAsset(assetId: string) {
  const softwares: ISoftware[] = await getSoftwares();
  return softwares.filter((s) => s.id_asset === assetId);
}

export async function fetchSoftwareById(id: string) {
  return await getSoftwareById(id);
}

export async function removeSoftware(id: string) {
  return await deleteSoftware(id);
}
