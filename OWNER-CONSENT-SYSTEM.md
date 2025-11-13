# Système d'Enregistrement des Accords de Consentement

## Vue d'ensemble

Ce système permet d'enregistrer de manière juridiquement valable les accords de consentement du propriétaire lors de la création d'une annonce.

## Architecture

### 1. Base de données (Supabase)

**Table : `owner_consent_logs`**

Exécutez le fichier SQL `create-owner-consent-logs-table.sql` dans votre éditeur SQL Supabase.

Cette table enregistre :
- **Informations de l'accord** : listing_id, tenant_id, owner_email, tenant_full_name, listing_address
- **Consentements** : info_accuracy_accepted, owner_consent_accepted
- **Traçabilité** : ip_address, user_agent, consent_accepted_at
- **Archivage** : agreement_text (texte complet de l'accord), consent_version
- **Métadonnées** : created_at, updated_at

**Sécurité RLS** :
- Les utilisateurs peuvent voir leurs propres logs
- Seuls les utilisateurs authentifiés peuvent créer des logs via l'API

### 2. API Backend

**Route : `/api/owner-consent/log`**

Enregistre l'accord avec :
- Validation des données obligatoires
- Capture de l'IP et du User-Agent
- Horodatage précis (UTC)
- Stockage du texte complet de l'accord

### 3. Frontend

**Fichier : `app/ajout-logement/page.jsx`**

Le formulaire :
1. Affiche deux cases à cocher obligatoires :
   - Attestation d'exactitude des informations
   - Accord de consentement du propriétaire
2. Génère le texte complet de l'accord
3. Envoie les données à l'API lors de la soumission

### 4. Helper

**Fichier : `lib/generateOwnerConsentText.js`**

Génère le texte juridique complet de l'accord incluant :
- Date et heure d'acceptation
- Noms des parties
- Adresse du logement
- Articles de l'accord
- Attestations cochées

## Valeur Juridique

Le système garantit la valeur juridique de l'accord grâce à :

1. **Horodatage précis** : Date et heure exactes de l'acceptation
2. **Identification** : Email propriétaire, nom complet locataire, adresse logement
3. **Traçabilité technique** : IP, User-Agent, version de l'accord
4. **Preuve d'acceptation** : Enregistrement des cases cochées
5. **Archivage** : Texte complet de l'accord au moment de l'acceptation
6. **Immuabilité** : Les logs ne peuvent pas être modifiés (pas de policy UPDATE)

## Utilisation

### Côté développeur

1. **Exécutez le SQL dans Supabase** :
   - Ouvrez l'éditeur SQL de Supabase
   - Copiez-collez le contenu de `create-owner-consent-logs-table.sql`
   - Exécutez le script

2. **Vérifiez que l'API est déployée** :
   - L'API est dans `app/api/owner-consent/log/route.js`
   - Elle sera automatiquement déployée avec Next.js

3. **Testez** :
   - Créez une annonce
   - Vérifiez dans la table `owner_consent_logs` de Supabase que l'enregistrement a été créé

### Côté utilisateur

L'utilisateur doit :
1. Cocher "J'atteste sur l'honneur que les informations sont exactes"
2. Cocher "J'atteste avoir l'accord de mon propriétaire"
3. Le bouton "Soumettre" ne sera activé que si les deux cases sont cochées
4. À la soumission, l'accord est automatiquement enregistré

## Consultation des Logs

Pour consulter les accords enregistrés :

```sql
SELECT 
  id,
  tenant_full_name,
  owner_email,
  listing_address,
  consent_accepted_at,
  ip_address,
  consent_version
FROM owner_consent_logs
ORDER BY consent_accepted_at DESC;
```

Pour voir le texte complet d'un accord :

```sql
SELECT agreement_text
FROM owner_consent_logs
WHERE id = 'uuid-de-l-accord';
```

## Conformité RGPD

Les données personnelles sont :
- Collectées avec consentement explicite
- Utilisées uniquement pour la preuve juridique de l'accord
- Conservées de manière sécurisée avec RLS
- Accessibles uniquement par l'utilisateur concerné

## Migration

Si vous avez déjà des annonces existantes, vous pouvez créer des logs rétroactifs :

```sql
-- À adapter selon vos besoins
INSERT INTO owner_consent_logs (
  listing_id,
  tenant_id,
  owner_email,
  tenant_full_name,
  listing_address,
  info_accuracy_accepted,
  owner_consent_accepted,
  consent_version,
  agreement_text
)
SELECT 
  id,
  owner_id,
  email_proprietaire,
  'Migration rétroactive',
  address,
  true,
  true,
  'v1.0-retroactive',
  'Accord migré rétroactivement'
FROM listings
WHERE status = 'validé';
```
