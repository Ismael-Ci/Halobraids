# Halo Braids — Luxury Hair Braiding Studio · Ottawa

Site web officiel du studio de tressage de luxe Halo Braids, basé à Ottawa (ON) / Gatineau (QC).

## Live

🌐 [https://ismael-ci.github.io/Halobraids](https://ismael-ci.github.io/Halobraids)

## Stack

Vanilla HTML · CSS · JavaScript — aucun framework, aucune dépendance.

## Pages

| Page | Description |
|---|---|
| `index.html` | Accueil — hero, stats, services, expérience, avis |
| `services.html` | Catalogue complet des 6 services avec tarifs |
| `gallery.html` | Galerie avec filtres par style et lightbox |
| `booking.html` | Réservation 4 étapes (service → styliste → date/heure → confirmation) |
| `account.html` | Connexion / Inscription |
| `dashboard.html` | Tableau de bord client (historique, profil) |
| `faq.html` | Questions fréquentes |
| `contact.html` | Formulaire de contact + infos |

## Assets

```
assets/
  styles.css    — design system complet (palette gold/cream/black)
  app.js        — i18n FR/EN, auth localStorage, header/footer
  data.js       — services, stylistes, créneaux, traductions
  booking.js    — flow de réservation (state machine)
  luxury.js     — effets interactifs (curseur, particules, tilt, confetti…)
  favicon.svg   — icône de marque
```

## Fonctionnalités

- Bilingue FR / EN (toggle instantané)
- Système de réservation complet avec calendrier et créneaux
- Comptes client avec localStorage (auth côté navigateur)
- Curseur personnalisé doré, particules hero, tilt 3D, typewriter, parallax
- Marquee clients, splash screen, confetti, lightbox galerie, filtres
- Barre de progression scroll, bouton retour en haut, barre sticky booking

## Déploiement — GitHub Pages

1. Aller dans **Settings → Pages** du repo
2. Source : **Deploy from a branch → main → / (root)**
3. Le site sera disponible à `https://ismael-ci.github.io/Halobraids/`

## Personnalisation

- **Prix / Services** → `assets/data.js` (tableau `SERVICES`)
- **Stylistes / Horaires** → `assets/data.js` (tableau `STYLISTS`)
- **Traductions** → `assets/data.js` (objet `I18N`)
- **Couleurs** → `assets/styles.css` (variables CSS `:root`)
- **Contact (email, Instagram, heures)** → `assets/app.js` → `renderFooter()`

## Plan d'affaires

`HaloBraids_Plan_Affaires.pdf` — projections financières, stratégie marketing, structure légale Ottawa/Gatineau, roadmap 18 mois.

---

© 2026 Halo Braids · Ottawa, ON · Canada
