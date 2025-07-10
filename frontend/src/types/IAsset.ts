/** @format */

export interface IAsset {
  id: string;
  idClient: string;
  name: string;
  type: string;
  vendor?: string;
  model?: string;
  os?: string;
  location?: string;
  observations?: string;
}
