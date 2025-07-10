SELECT * FROM cve.container;

SELECT cve_id, COUNT(*) AS occurrences
FROM cve.container
GROUP BY cve_id
HAVING COUNT(*) > 2