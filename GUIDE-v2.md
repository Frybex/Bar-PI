# 🍺 Bar Pi — Guide de déploiement

App de carte boisson avec QR code, scanner caméra et solde en temps réel. Utilisable pour n'importe quel événement (bal, soirée, fête, festival).

## Fichiers à héberger

```
index.html       ← version CLIENT (PWA installable)
bar.html         ← version BAR / ADMIN
manifest.json    ← rend l'app installable
sw.js            ← service worker (fonctionne hors ligne)
icon-192.png     ← icône app (à créer, voir étape 1)
icon-512.png     ← icône app grande taille
```

---

## ÉTAPE 1 — Créer les icônes (2 min)

Va sur https://favicon.io ou https://realfavicongenerator.net.
- Choisis une emoji 🍺 ou upload ton logo.
- Télécharge les fichiers 192×192 et 512×512 en PNG.
- Renomme-les `icon-192.png` et `icon-512.png`.
- Place-les dans le même dossier que `index.html`.

---

## ÉTAPE 2 — Firebase

1. https://console.firebase.google.com → **Nouveau projet**.
2. Active **Realtime Database** (mode test, région Europe).
3. Active **Authentication** → **Sign-in method** → **Email/Password** (la première case, pas "Email link").
4. Authentication → **Settings** → **Authorized domains** → ajoute ton domaine GitHub Pages.

Copie ta config dans les deux fichiers (`index.html` ET `bar.html`) :
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
Dans Firebase Console → Realtime Database → **Rules**, colle :
```json
{
  "rules": {
    "cards":  { ".read": true, ".write": true },
    "users":  { ".read": true, ".write": true },
    "config": { ".read": true, ".write": true }
  }
}
```
Pour plus de sécurité en production, restreins les écritures à l'utilisateur authentifié.

---

## ÉTAPE 3 — SumUp (paiement)

Dans `index.html`, remplace :
```javascript
const SUMUP_MERCHANT_CODE = "YOUR_MERCHANT_CODE";
const SUMUP_API_KEY        = "YOUR_SUMUP_API_KEY";
```
Par tes vraies valeurs SumUp (Profil → Intégrations → Clés API).

⚠️ Tant que `SUMUP_API_KEY = "YOUR_SUMUP_API_KEY"`, l'app affiche un bouton **"Simuler paiement réussi (test)"** pour pouvoir tester sans encaisser.

---

## ÉTAPE 4 — Héberger sur GitHub Pages

1. Crée un repo GitHub : `bar-pi`.
2. Upload tous les fichiers (`index.html`, `bar.html`, `manifest.json`, `sw.js`, `icon-*.png`).
3. Settings → Pages → Branch: main → Save.
4. Ton app est en ligne :
   - **Clients** : `https://USERNAME.github.io/bar-pi/`
   - **Bar / Admin** : `https://USERNAME.github.io/bar-pi/bar.html`

L'accès caméra (scanner QR) requiert HTTPS — GitHub Pages le fournit par défaut.

---

## Mots de passe par défaut

| Rôle | Mot de passe | Où changer |
|------|-------------|------------|
| Accès bar (animateurs) | `bar2024` | Admin → Réglages → Mot de passe bar |
| Admin | `admin2024` | Admin → Réglages → Mot de passe admin |

**À changer dès le premier accès admin.**

---

## Utilisation

### Côté client
1. Envoie le lien `https://USERNAME.github.io/bar-pi/`.
2. Sur iOS : Safari → Partager → "Sur l'écran d'accueil" → l'icône apparaît.
3. Sur Android : Chrome → bannière automatique "Installer l'application".
4. Première fois : onglet **Créer un compte** → prénom + nom + email + mot de passe.
5. Choisit son montant → paie via SumUp → reçoit son QR code instantanément.
6. Présente le QR au bar pour ses consos. Solde mis à jour en temps réel.

### Côté bar
- Lien `https://USERNAME.github.io/bar-pi/bar.html`.
- Code d'accès : `bar2024`.
- **Cartes** : liste recherchable par prénom / nom / email.
- **Scanner** : ouvre la caméra, scanne le QR du client → fiche directement ouverte.
- Sur la fiche : ajouter des boissons au panier, valider, voir l'historique. Les cartes entièrement consommées sont supprimées automatiquement.

### Côté admin
- Onglet Admin → mot de passe `admin2024`.
- Stats : nombre de cartes vendues, total encaissé, total consommé, restant.
- Réglages : nom de l'événement, mots de passe bar et admin, reset complet.

---

## Architecture des données Firebase

```
/config
  /eventName    → "Bar Pi" (modifiable depuis Admin)
  /barPw        → "bar2024"
  /adminPw      → "admin2024"

/users
  /{uid}
    /activeCardId → "-OAbc123..." (carte active actuelle)
    /profile
      /firstname → "Marie"
      /lastname  → "Dupont"
      /email     → "marie@example.com"
      /createdAt → "2026-04-15T..."

/cards
  /{cardId}
    /uid         → "firebase-user-uid"
    /email       → "marie@example.com"
    /firstname   → "Marie"
    /lastname    → "Dupont"
    /displayName → "Marie Dupont"
    /amount      → 10
    /createdAt   → "2026-04-15T..."
    /createdTime → "20:34"
    /checkoutId  → "sumup-checkout-id"
    /transactions
      /{txId}
        /items   → { "biere": 2, "soda": 1 }
        /total   → 5
        /ts      → 1745875200000
        /time    → "21:12"
```

Quand une carte est entièrement consommée, elle est supprimée automatiquement de `/cards/{cardId}` et la référence `/users/{uid}/activeCardId` est nettoyée.
