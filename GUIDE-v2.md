# 🍺 Bar Scout v2 — Guide de déploiement

## Fichiers à héberger

```
index.html       ← version CLIENT (PWA installable)
bar.html         ← version BAR/ADMIN (animateurs uniquement)
manifest.json    ← rend l'app installable
sw.js            ← service worker (fonctionne hors ligne)
icon-192.png     ← icône app (à créer, voir plus bas)
icon-512.png     ← icône app grande taille
```

---

## ÉTAPE 1 — Créer les icônes (2 min)

Va sur https://realfavicongenerator.net ou https://favicon.io
- Choisis une emoji 🍺 ou upload une image
- Télécharge les fichiers 192×192 et 512×512 en PNG
- Renomme-les `icon-192.png` et `icon-512.png`
- Place-les dans le même dossier que index.html

---

## ÉTAPE 2 — Firebase (si pas encore fait)

1. https://console.firebase.google.com → nouveau projet
2. Active **Realtime Database** (mode test, région Europe)
3. Active **Authentication** → **Fournisseurs de connexion** → **Lien e-mail**
4. Dans Authentication → **Paramètres** → **Domaines autorisés** → ajoute ton domaine GitHub Pages ou Netlify

Copie ta config dans les deux fichiers (index.html ET bar.html) :
```javascript
const FIREBASE_CONFIG = {
  apiKey:      "...",
  authDomain:  "...",
  databaseURL: "...",
  projectId:   "...",
  appId:       "..."
};
```

### Règles Firebase Realtime Database
Dans Firebase Console → Realtime Database → Règles, colle :
```json
{
  "rules": {
    "cards": { ".read": true, ".write": true },
    "users": { ".read": true, ".write": true },
    "config": { ".read": true, ".write": true }
  }
}
```

---

## ÉTAPE 3 — SumUp (quand tu as les clés)

Dans index.html, remplace :
```javascript
const SUMUP_MERCHANT_CODE = "YOUR_MERCHANT_CODE";
const SUMUP_API_KEY        = "YOUR_SUMUP_API_KEY";
```
Par tes vraies valeurs SumUp (Profil → Intégrations → Clés API).

⚠️ En attendant, le bouton "Simuler paiement" fonctionne en mode test.

---

## ÉTAPE 4 — Héberger sur GitHub Pages

1. Crée un repo GitHub : `bar-scout`
2. Upload TOUS les fichiers (index.html, bar.html, manifest.json, sw.js, icon-*.png)
3. Settings → Pages → Branch: main → Save
4. Ton app est en ligne :
   - **Clients** : `https://USERNAME.github.io/bar-scout/`
   - **Bar/Admin** : `https://USERNAME.github.io/bar-scout/bar.html`

---

## Mots de passe par défaut

| Rôle | Mot de passe | Où changer |
|------|-------------|------------|
| Accès bar (animateurs) | `bar2024` | Admin → Réglages → Mot de passe bar |
| Admin | `scout2024` | Admin → Réglages → Mot de passe admin |

**Change-les avant le bal !**

---

## Utilisation le soir

### Pour les clients
1. Envoie le lien `https://USERNAME.github.io/bar-scout/`
2. Sur iOS : Safari → Partager → "Sur l'écran d'accueil" → l'icône 🍺 apparaît
3. Sur Android : Chrome → bannière automatique "Installer l'application"
4. Le client entre son email, reçoit un lien magique, clique → connecté
5. Sa carte est sauvegardée même s'il ferme l'app

### Pour les animateurs bar
- Lien `https://USERNAME.github.io/bar-scout/bar.html`
- Code d'accès : `bar2024`
- Ne pas partager ce lien publiquement

### Pour l'admin
- Même lien bar.html → onglet Admin → mot de passe `scout2024`

---

## Architecture des données Firebase

```
/config
  /eventName    → "Bal des Scouts"
  /barPw        → "bar2024"
  /adminPw      → "scout2024"

/users
  /{uid}
    /activeCardId → "-OAbc123..."

/cards
  /{cardId}
    /uid         → "firebase-user-uid"
    /email       → "jean@example.com"
    /amount      → 10
    /createdAt   → "2025-04-26T..."
    /createdTime → "20:34"
    /checkoutId  → "sumup-checkout-id"
    /transactions
      /{txId}
        /items   → { "biere": 2, "soda": 1 }
        /total   → 5
        /ts      → 1714165200000
        /time    → "21:12"
```
