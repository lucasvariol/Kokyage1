# 📋 INSTRUCTIONS - Système PDF Accord de Sous-Location

## ✅ Étape 1 : Exécuter la migration SQL (OBLIGATOIRE)

1. Connectez-vous à votre **Supabase Dashboard**
2. Allez dans **SQL Editor**
3. Copiez-collez le contenu du fichier **`SETUP-OWNER-CONSENT-PDF.sql`**
4. Cliquez sur **Run** pour exécuter

Cette migration va :
- ✅ Ajouter la colonne `owner_consent_pdf` à la table `listings`
- ✅ Créer la table `pending_owner_verification` pour les tokens
- ✅ Désactiver RLS sur `pending_owner_verification` (accès API uniquement)

## 📝 Étape 2 : Tester la génération de PDF

### Option A : Via l'interface (recommandé)
1. Créez un nouveau logement (ou utilisez-en un existant)
2. Le propriétaire valide l'accord via le lien reçu par email
3. Le PDF est **automatiquement généré** après la signature
4. Vous pouvez le télécharger depuis :
   - Page **/profil-hote** (bouton "Accord signé")
   - Page **/logement/[id]** (bouton "Télécharger l'accord signé")

### Option B : Via l'API (pour debug)
```bash
curl -X POST https://kokyage.com/api/owner-consent/generate-pdf \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{"listingId": "YOUR_LISTING_ID"}'
```

## 🔍 Vérification que ça fonctionne

### Dans la console navigateur (F12)
Cliquez sur le bouton "Relire l'accord" et vérifiez les logs :
- `🔍 Click bouton accord - item.owner_consent_pdf: Présent` → PDF existe ✅
- `📄 Taille PDF: 12345` → Taille en bytes
- `📥 Début téléchargement PDF...` → Le téléchargement commence
- `✅ PDF téléchargé avec succès` → Tout fonctionne !

Si vous voyez `Absent`, c'est que :
1. ❌ La migration SQL n'a pas été exécutée
2. ❌ Le propriétaire n'a pas encore validé l'accord
3. ❌ Une erreur s'est produite lors de la génération

### Dans les logs serveurs (Vercel/Railway)
Après la validation du propriétaire, vous devriez voir :
```
📄 [generateOwnerConsentPDF] Début génération pour listing: xxx
✅ PDF généré et sauvegardé avec succès pour listing: xxx
```

## 🐛 En cas de problème

### Le PDF ne se télécharge pas
1. **Vérifiez que la migration SQL est exécutée** (étape obligatoire)
2. Ouvrez la console (F12) et regardez les logs
3. Vérifiez que `owner_consent_pdf` existe dans la DB :
   ```sql
   SELECT id, owner_consent_pdf IS NOT NULL as has_pdf 
   FROM listings 
   WHERE id = 'YOUR_LISTING_ID';
   ```

### Le PDF n'est pas généré automatiquement
1. Regardez les logs serveur après validation propriétaire
2. Vérifiez que jsPDF est installé : `npm list jspdf`
3. Testez manuellement via l'API

### Erreur "owner_consent_pdf column does not exist"
➡️ **Vous n'avez pas exécuté la migration SQL !** Voir Étape 1.

## 📦 Fichiers créés/modifiés

### Nouveaux fichiers
- `lib/generateOwnerConsentPDF.js` - Fonction utilitaire génération PDF
- `SETUP-OWNER-CONSENT-PDF.sql` - Migration SQL complète
- `INSTRUCTIONS-PDF.md` - Ce fichier

### Fichiers modifiés
- `app/api/owner-consent/log/route.js` - Appel génération PDF après signature
- `app/api/owner-consent/generate-pdf/route.js` - Route API simplifiée
- `app/profil-hote/page.jsx` - Bouton téléchargement propriétaire/locataire
- `app/logement/[id]/page.jsx` - Bouton téléchargement + logs debug

## 🎯 Prochaines étapes

1. ✅ Exécuter la migration SQL
2. ✅ Tester avec un vrai logement
3. ✅ Vérifier les logs dans la console
4. ✅ Supprimer les logs de debug si tout fonctionne

---

**Support** : Si le problème persiste, partagez les logs de la console (F12) et les logs serveur.
