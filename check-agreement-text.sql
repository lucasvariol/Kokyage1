-- Vérifier si les accords ont bien le texte sauvegardé
SELECT 
  id,
  listing_id,
  tenant_full_name,
  owner_full_name,
  tenant_signed_at,
  owner_signed_at,
  agreement_text IS NOT NULL as has_text,
  LENGTH(agreement_text) as text_length,
  LEFT(agreement_text, 100) as text_preview
FROM owner_consent_logs
ORDER BY created_at DESC
LIMIT 5;
