-- Activer l'extension pg_cron dans Supabase
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Fonction pour traiter automatiquement les paiements après le checkout
CREATE OR REPLACE FUNCTION process_automatic_payments()
RETURNS void AS $$
DECLARE
  reservation_record RECORD;
BEGIN
  -- Trouver toutes les réservations terminées non encore traitées
  FOR reservation_record IN
    SELECT * FROM reservations
    WHERE status = 'confirmed'
    AND payment_status = 'paid'
    AND end_date < CURRENT_DATE
    AND balances_allocated = false
    AND caution_status != 'captured'  -- Caution pas encore capturée
  LOOP
    -- Log pour debug
    RAISE NOTICE 'Traitement auto paiement pour réservation: %', reservation_record.id;
    
    -- Ici tu pourrais appeler ton API de paiement automatique
    -- Par exemple via une fonction qui fait un HTTP request
    PERFORM http_post(
      'https://kokyage1.vercel.app/api/payment/process-automatic',
      jsonb_build_object(
        'reservationId', reservation_record.id,
        'secret', 'TON_SECRET_KEY'
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Planifier l'exécution automatique chaque jour à 2h du matin
SELECT cron.schedule(
  'process-automatic-payments',  -- nom du job
  '0 2 * * *',                   -- chaque jour à 2h00 (format cron)
  $$SELECT process_automatic_payments()$$
);

-- Vérifier les cron jobs actifs
SELECT * FROM cron.job;

-- Pour désactiver le job (si besoin)
-- SELECT cron.unschedule('process-automatic-payments');
