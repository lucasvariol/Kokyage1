# Configuration du Chatbot Kokyage

Ce fichier explique comment configurer et utiliser le chatbot.

## Installation

1. **Installer la dépendance OpenAI** :
```bash
npm install openai
```

2. **Configurer la clé API OpenAI** :
   - Créez un compte sur https://platform.openai.com/
   - Générez une clé API
   - Créez un fichier `.env.local` à la racine du projet :
   ```
   OPENAI_API_KEY=sk-votre-clé-ici
   ```

3. **Ajouter .env.local au .gitignore** (si ce n'est pas déjà fait) :
   ```
   .env.local
   ```

## Structure des fichiers

### `/chatbot-context/`
Ce dossier contient les fichiers qui alimentent le chatbot :

- **`system-prompt.txt`** : Instructions principales pour le chatbot (ton rôle, style, comportement)
- **`faq.txt`** : Base de connaissances FAQ pour répondre aux questions
- **Ajoutez d'autres fichiers .txt** selon vos besoins (ex: `legal.txt`, `pricing.txt`, etc.)

### `/app/api/chatbot/route.js`
API endpoint qui :
- Charge les fichiers de contexte depuis `/chatbot-context/`
- Envoie les messages à l'API OpenAI
- Retourne la réponse

### `/app/_components/Chatbot.jsx`
Composant UI du chatbot :
- Bouton flottant en bas à droite
- Fenêtre de chat moderne
- Gestion des messages
- Animation et UX optimisée

## Personnalisation

### Ajouter de nouvelles sources de contexte

1. Créez un nouveau fichier dans `/chatbot-context/` :
```
chatbot-context/
  ├── system-prompt.txt
  ├── faq.txt
  ├── legal-info.txt      <- nouveau
  └── pricing-details.txt <- nouveau
```

2. Modifiez `/app/api/chatbot/route.js` pour charger ces fichiers :
```javascript
const legalInfo = fs.readFileSync(path.join(contextDir, 'legal-info.txt'), 'utf-8');
const pricingDetails = fs.readFileSync(path.join(contextDir, 'pricing-details.txt'), 'utf-8');

const fullSystemPrompt = `${systemPrompt}

FAQ:
${faqContent}

INFORMATIONS LÉGALES:
${legalInfo}

DÉTAILS TARIFAIRES:
${pricingDetails}`;
```

### Modifier le modèle GPT

Dans `/app/api/chatbot/route.js`, ligne ~50 :
```javascript
model: "gpt-4o-mini", // Options: gpt-4o, gpt-4o-mini, gpt-3.5-turbo
```

- `gpt-4o` : Plus intelligent mais plus cher
- `gpt-4o-mini` : Bon équilibre qualité/prix (recommandé)
- `gpt-3.5-turbo` : Plus rapide et moins cher

### Personnaliser l'apparence

Modifiez `/app/_components/Chatbot.jsx` :
- Couleurs : cherchez `#60A29D` et `#4A8985`
- Position : `bottom: '24px', right: '24px'`
- Taille : `width: '380px', height: '600px'`

## Utilisation

Le chatbot est automatiquement affiché sur toutes les pages où vous l'importez.

Pour l'ajouter à d'autres pages :
```jsx
import Chatbot from './_components/Chatbot';

export default function MaPage() {
  return (
    <>
      {/* Votre contenu */}
      <Chatbot />
    </>
  );
}
```

## Coûts

Le chatbot utilise l'API OpenAI (payant) :
- **gpt-4o-mini** : ~0.15€ pour 1000 messages (recommandé)
- **gpt-3.5-turbo** : ~0.002€ pour 1000 messages
- **gpt-4o** : ~3€ pour 1000 messages

Surveillez votre usage sur https://platform.openai.com/usage

## Dépannage

### "Le chatbot n'est pas encore configuré"
→ Ajoutez `OPENAI_API_KEY` dans `.env.local` et redémarrez le serveur

### Erreur "Module not found: openai"
→ Exécutez `npm install openai`

### Le chatbot ne répond pas correctement
→ Vérifiez et améliorez le contenu de `/chatbot-context/system-prompt.txt`

### Réponses trop longues
→ Ajustez `max_tokens` dans `/app/api/chatbot/route.js` (ligne ~52)

## Support

Pour toute question, consultez la documentation OpenAI :
https://platform.openai.com/docs
