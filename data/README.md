Place the tourist tax (taxe de séjour) XML file here as taxe_sejour_donnees_deliberations.xml or set TAXE_SEJOUR_XML_PATH to an absolute path.

- Expected filename: data/taxe_sejour_donnees_deliberations.xml
- Env override: TAXE_SEJOUR_XML_PATH

The API and utils will attempt to parse rates for 'non classé'. If parsing fails, a safe fallback is used.