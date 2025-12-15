# Génération automatique de PDF pour les accords de sous-location

## Vue d'ensemble
Lorsqu'un propriétaire valide un accord de sous-location, le système génère automatiquement un PDF professionnel contenant toutes les informations légales nécessaires et les signatures numériques.

## Fonctionnalités

### 1. Génération automatique du PDF
- **Déclencheur** : Lorsque le propriétaire signe l'accord via `/api/owner-consent/log`
- **Format** : PDF multipages avec formatage professionnel
- **Stockage** : Base64 dans la colonne `listings.owner_consent_pdf`
- **Bibliothèque** : jsPDF v3.x

### 2. Contenu du PDF
Le PDF généré contient :
- **Badge "SIGNÉ NUMÉRIQUEMENT"** en haut à droite
- **Informations du logement** : Adresse, ville, code postal, type
- **Informations des signataires** :
  - Locataire principal (nom, email)
  - Propriétaire (nom, email)
- **Clauses légales** (5 clauses numérotées) :
  1. Objet de l'accord
  2. Conditions de la sous-location
  3. Responsabilités du locataire principal
  4. Durée et résiliation
  5. Acceptation des termes
- **Signatures numériques** avec horodatage
- **Footer légal** avec références au Code civil (articles 1366-1367)
- **Identifiant unique du document**

### 3. Accès au PDF
Le PDF est accessible depuis le profil hôte (`/profil-hote`) :
- **Pour le propriétaire** : Bouton "Accord signé" dans la section "En tant que Propriétaire"
- **Pour le locataire** : Bouton "Accord signé" dans la section "En tant que Locataire"
- **Condition d'affichage** : Le bouton n'apparaît que si `owner_consent_pdf` existe

### 4. Téléchargement
- Clic sur le bouton → Téléchargement automatique
- Nom du fichier : `Accord-Sous-Location-[titre-logement].pdf`
- Format : PDF standard lisible sur tous les appareils

## Fichiers modifiés/créés

### Nouveaux fichiers
1. **`app/api/owner-consent/generate-pdf/route.js`**
   - Route POST pour générer le PDF
   - Utilise jsPDF pour créer le document
   - Sauvegarde en base64 dans la table `listings`

2. **`add-owner-consent-pdf-column.sql`**
   - Migration SQL pour ajouter la colonne `owner_consent_pdf`
   - À exécuter dans Supabase Dashboard

### Fichiers modifiés
1. **`app/api/owner-consent/log/route.js`**
   - Ajout d'un appel automatique à `/api/owner-consent/generate-pdf` après la signature du propriétaire
   - Gestion d'erreur non-bloquante

2. **`app/profil-hote/page.jsx`**
   - Ajout de `owner_consent_pdf` dans la requête Supabase
   - Nouvelle fonction `downloadOwnerConsentPDF()` pour gérer le téléchargement
   - Boutons de téléchargement dans les cartes de logements (sections propriétaire et locataire)

3. **`package.json`**
   - Ajout de la dépendance `jspdf: ^3.0.0`

## Installation

### 1. Installer la dépendance
```powershell
npm install jspdf
```

### 2. Exécuter la migration SQL
Dans Supabase Dashboard → SQL Editor, exécuter :
```sql
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS owner_consent_pdf TEXT;

COMMENT ON COLUMN listings.owner_consent_pdf IS 'PDF de l''accord de sous-location signé numériquement (base64)';
```

### 3. Tester le flux complet
1. Créer un logement avec consentement propriétaire activé
2. Le locataire demande le consentement
3. Le propriétaire signe → PDF généré automatiquement
4. Vérifier sur `/profil-hote` que le bouton "Accord signé" apparaît
5. Télécharger et ouvrir le PDF

## Conformité légale

### Code civil français
Le PDF fait référence aux articles suivants :
- **Article 1366** : "L'écrit électronique a la même force probante que l'écrit sur support papier"
- **Article 1367** : "La signature électronique consiste en l'usage d'un procédé fiable d'identification"

### Éléments de traçabilité
- Horodatage précis (date et heure de signature)
- Identifiant unique du document
- Informations complètes des deux parties
- Badge "SIGNÉ NUMÉRIQUEMENT" visible

## API Endpoints

### POST `/api/owner-consent/generate-pdf`
Génère et sauvegarde le PDF pour un logement donné.

**Headers** :
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body** :
```json
{
  "listingId": "uuid-du-logement"
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "PDF généré et sauvegardé avec succès"
}
```

**Erreurs possibles** :
- `401` : Non authentifié
- `400` : Logement non trouvé ou données manquantes
- `500` : Erreur lors de la génération du PDF

## Notes techniques

### Pourquoi Base64 ?
- Simplicité : Pas besoin de gérer Supabase Storage
- Atomicité : Le PDF est stocké avec les données du logement
- Performance : Pour des PDFs de quelques pages (< 100 Ko en base64)

### Limitations
- Taille maximale recommandée : ~1 MB en base64
- Le PDF actuel fait environ 30-50 Ko (bien en dessous de la limite)

### Amélioration future possible
- Migration vers Supabase Storage si besoins de PDFs plus volumineux
- Ajout d'une prévisualisation inline dans un modal
- Envoi automatique par email aux deux parties

## Sécurité

### Contrôles d'accès
- Seuls le propriétaire et le locataire peuvent télécharger le PDF
- Vérification de l'authentification via Supabase Auth
- Le PDF n'est généré qu'après les deux signatures

### Protection des données
- Les emails sont visibles dans le PDF (nécessaires pour l'identification légale)
- Le PDF n'est pas accessible publiquement (pas d'URL directe)
- RLS Supabase protège l'accès à la colonne `owner_consent_pdf`
