# Héberger le bot gratuitement sur Render

Render propose un plan web gratuit qui n'exige pas de carte bancaire. Le service s'endort après 15 min sans requête HTTP — on compense avec un ping externe gratuit.

## 1. Pousser le code sur GitHub

```bash
git init
git add .
git commit -m "Bot nlafonte"
```

Crée un dépôt **privé** sur https://github.com/new (important : le bot y stockera des infos de config, même si le vrai token ne sera jamais commité grâce au `.gitignore`), puis :

```bash
git remote add origin https://github.com/<ton-pseudo>/<nom-du-repo>.git
git branch -M main
git push -u origin main
```

## 2. Créer le service sur Render

1. Va sur https://dashboard.render.com/register et crée un compte (gratuit, sans CB)
2. "New +" → "Web Service"
3. Connecte ton compte GitHub et sélectionne le dépôt du bot
4. Configure :
   - **Name** : `nlafonte-bot` (ou ce que tu veux)
   - **Region** : Frankfurt (le plus proche de la France)
   - **Branch** : `main`
   - **Runtime** : Node
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Instance Type** : **Free**
5. Dans "Environment Variables", ajoute toutes les variables de ton fichier `.env` (une par une) :
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `GUILD_ID`
   - `WELCOME_CHANNEL_ID`
   - `RULES_CHANNEL_ID`
   - `SUPPORT_CHANNEL_ID`
   - `ANNOUNCE_CHANNEL_ID`
   - `LEVEL_UP_CHANNEL_ID`
   - `AUTOROLE_ID`
   - `STAFF_ROLE_ID`
6. Clique "Create Web Service". Le déploiement prend 2-3 minutes.
7. Une fois en ligne, Render te donne une URL du style `https://nlafonte-bot.onrender.com` — note-la.

## 3. Déployer les commandes slash (une seule fois)

Dans l'onglet "Shell" de ton service Render (en haut à droite une fois le service actif) :

```bash
npm run deploy
```

## 4. Empêcher le service de s'endormir

Le plan gratuit Render s'endort après 15 minutes sans trafic HTTP. Un bot connecté au Gateway Discord reste actif même sans trafic HTTP — mais pour éviter tout risque, configure un ping régulier :

1. Va sur https://cron-job.org (gratuit, sans CB)
2. Crée un compte, puis un nouveau "Cronjob"
3. URL : ton URL Render (`https://nlafonte-bot.onrender.com`)
4. Intervalle : toutes les 10 minutes

## Mettre à jour le bot plus tard

Après toute modification du code :

```bash
git add .
git commit -m "Description du changement"
git push
```

Render redéploie automatiquement à chaque push sur `main`.
