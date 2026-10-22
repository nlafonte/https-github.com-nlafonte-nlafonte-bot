# Bot nlafonte

Bot Discord pour le serveur **nlafonte** : bienvenue, auto-rôle, modération, tickets, XP/niveaux.

## 1. Créer l'application Discord

1. Va sur https://discord.com/developers/applications
2. "New Application" → donne-lui un nom (ex: `nlafonte`)
3. Onglet **Bot** → "Reset Token" → copie le token (ne le partage jamais)
4. Dans le même onglet, active :
   - `SERVER MEMBERS INTENT`
   - `MESSAGE CONTENT INTENT`
5. Onglet **OAuth2 > URL Generator** :
   - Scopes : `bot`, `applications.commands`
   - Permissions : `Administrator` (le plus simple pour démarrer)
   - Copie l'URL générée et ouvre-la pour inviter le bot sur ton serveur `nlafonte`
6. Onglet **General Information** : copie l'**Application ID** (= `CLIENT_ID`)

## 2. Configurer

```bash
cp .env.example .env
```

Remplis dans `.env` :
- `DISCORD_TOKEN` : le token copié à l'étape 1
- `CLIENT_ID` : l'Application ID
- `GUILD_ID` : déjà pré-rempli (serveur nlafonte)
- Les IDs de salons sont déjà pré-remplis
- `AUTOROLE_ID` / `STAFF_ROLE_ID` : à remplir une fois les rôles créés
- `TICKET_CATEGORY_ID` : l'ID de la catégorie où créer les tickets (optionnel, sinon racine du serveur)

## 3. Installer et lancer

```bash
npm install
npm run deploy   # enregistre les commandes slash (une fois, ou à chaque ajout de commande)
npm start        # démarre le bot
```

## Commandes disponibles

**Modération** (nécessite les permissions adéquates)
- `/kick membre [raison]`
- `/ban membre [raison] [jours_messages]`
- `/mute membre duree [raison]`
- `/unmute membre`
- `/clear nombre`
- `/warn membre raison`
- `/warnings membre`

**Utilitaire**
- `/ping`
- `/rank [membre]`
- `/leaderboard`
- `/announce salon titre message`
- `/ticket-panel` (poste le panneau d'ouverture de ticket dans le salon courant — à utiliser dans `#support`)

## Fonctionnement automatique

- **Bienvenue** : message dans `#bienvenue` + attribution du rôle auto à l'arrivée d'un membre
- **XP** : les membres gagnent de l'XP en discutant (cooldown 60s), annonce de level up
- **Tickets** : bouton "Ouvrir un ticket" → crée un salon privé `ticket-pseudo`, fermable avec le bouton "Fermer"
