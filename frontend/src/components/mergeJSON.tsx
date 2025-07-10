/** @format */

import { adaptCVERecords } from "@/lib/adaptCve";
import CVERecordTemplate from "@/templates/cveTemplate";

// Esta función agrupa y fusiona por cve_id los datos de una consulta a la base de datos
export function groupAndMergeData(data: string[]) {
  const grouped = data.reduce((acc: any, item: any) => {
    const hash = item.container_content_hash;
    if (!acc[hash]) acc[hash] = [];
    acc[hash].push(item);
    return acc;
  }, {});

  const merged = Object.values(grouped).map((group: any) => {
    const allKeys: any = [
      ...new Set(group.flatMap((obj: any) => Object.keys(obj))),
    ];
    const result: any = {};

    for (const key of allKeys) {
      const vals = group
        .map((obj: any) => obj[key])
        .filter((v: any) => v !== undefined);

      const distinct = [
        ...new Set(vals.map((v: any) => JSON.stringify(v))),
      ].map((v) => JSON.parse(v as string));

      result[key] = distinct.length === 1 ? distinct[0] : distinct;
    }

    return result;
  });

  return merged;
}

export function convertToArray(data: JSON) {
  return Object.values(data).flatMap((item: any) =>
    Array.isArray(item) ? item : [item]
  );
}

export function MergedDataPage(data: JSON) {
  // Extract arrays of the SJSON object
  const dataArray = convertToArray(data);

  // 1. Agrupar y fusionar los datos del JSON
  const mergedData = groupAndMergeData(dataArray);

  // 2. Adaptarlos usando tu función
  const adaptedRecords = adaptCVERecords(mergedData);

  return (
    <div>
      {/* <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(mergedData, null, 2)}
      </pre> */}
      <CVERecordTemplate record={adaptedRecords} />
    </div>
  );
}
