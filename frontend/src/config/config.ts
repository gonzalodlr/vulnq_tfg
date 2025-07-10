/** @format */

export const config = {
  port: process.env.PORT || 3000,
  NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
  BACKEND_URL: process.env.BACKEND_URL || "http://localhost:5001",
  BACKEND_ML_URL: process.env.BACKEND_ML_URL || "http://localhost:8383",
  jwtSecret: process.env.JWT_SECRET || "supersecret",
  token_ML: process.env.TOKEN_ML || "supersecrettoken",
  DB_CVE: process.env.DB_CVE || "cve",
  DB_CWE: process.env.DB_CWE || "cwe",
  DB_CPE: process.env.DB_CPE || "cpe",
  DB_CAPEC: process.env.DB_CAPEC || "capec",
};
