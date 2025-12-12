# Blog Kokyage

Structure de blog Next.js 16 avec markdown, optimisé pour le SEO.

## 📁 Structure

```
content/blog/          # Articles markdown
app/blog/              # Pages Next.js
  page.jsx            # Liste des articles avec filtres
  BlogClient.jsx      # Composant client pour filtres
  [slug]/
    page.jsx          # Page article (server component)
    ArticleContent.jsx # Contenu article (client component)
    article.css       # Styles CSS
app/_components/blog/  # Composants réutilisables
  ArticleCard.jsx     # Card preview article
  TableOfContents.jsx # Sommaire sticky
  ShareButtons.jsx    # Boutons partage social
  RelatedArticles.jsx # Articles connexes
lib/markdown.js        # Utilitaires parsing markdown
```

## ✍️ Créer un article

1. Créer un fichier `.md` dans `content/blog/`
2. Ajouter le frontmatter :

```markdown
---
title: "Titre de l'article"
description: "Meta description pour SEO (150-160 caractères)"
date: "2025-01-15"
author: "Kokyage"
category: "Guide juridique"
keywords: ["mot-clé 1", "mot-clé 2"]
image: "/images/blog/mon-article.jpg"
---

Contenu de l'article en markdown...

## Section 1

Texte avec **gras**, *italique*, [liens](/page).

### Sous-section

- Liste à puces
- Item 2

> Citation importante

| Colonne 1 | Colonne 2 |
|-----------|-----------|
| Data 1    | Data 2    |
```

## 🎨 Catégories disponibles

- Guide juridique
- Fiscalité
- Conseils pratiques
- Actualités
- Témoignages

## 🚀 Commandes

```bash
# Développement
npm run dev

# Build (génère les pages statiques)
npm run build

# Générer le sitemap (inclut automatiquement les articles)
npm run generate-sitemap
```

## 📊 SEO Features

✅ Métadonnées dynamiques (title, description, keywords)  
✅ Open Graph + Twitter Cards  
✅ Schema.org JSON-LD (Article)  
✅ Sitemap automatique  
✅ URLs optimisées (`/blog/slug`)  
✅ Temps de lecture calculé  
✅ Table des matières générée  
✅ Boutons de partage social  

## 📝 Guidelines d'écriture

**Structure recommandée (2000-2500 mots) :**

1. **Introduction** (150-200 mots)
   - Problème concret
   - Chiffre accrocheur
   - Plan de l'article

2. **Corps** (1500-2000 mots)
   - Sections H2 avec sous-sections H3
   - Exemples concrets
   - Tableaux, listes
   - Citations

3. **Conclusion** (200 mots)
   - Récapitulatif
   - CTA (déjà intégré automatiquement)

**Optimisation SEO :**

- Densité mots-clés : 1-2%
- Liens internes : 3-5 par article
- Images : 1 par section (alt text descriptif)
- Paragraphes : 3-4 lignes max

**Conversions :**

- CTA automatique en fin d'article
- Liens contextuels vers `/ajout-logement`, `/inscription`
- Lead magnets (PDFs, checklists) en échange d'inscription

## 🔗 Liens internes stratégiques

```markdown
<!-- Vers pages de conversion -->
[Créez votre annonce](/ajout-logement)
[Inscrivez-vous gratuitement](/inscription)

<!-- Vers autres articles (maillage SEO) -->
[Guide fiscal](/blog/fiscalite-location-meublee)
[Loi Alur](/blog/loi-alur-explications)

<!-- Vers pages utiles -->
[FAQ](/faq)
[Comment ça marche](/fonctionnement)
```

## 📈 Analytics

Les événements Google Analytics sont automatiquement trackés :

- `page_view` : Vue d'article
- `scroll` : Profondeur de scroll
- `click` : Clics sur CTA

## 🎯 Roadmap

- [ ] Newsletter signup widget
- [ ] Recherche full-text
- [ ] Tags/mots-clés cliquables
- [ ] Auteurs multiples
- [ ] Commentaires (Disqus/Giscus)
- [ ] Dark mode
- [ ] RSS feed
- [ ] AMP pages
