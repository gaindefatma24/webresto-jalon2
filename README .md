# WebResto - Application de commande en ligne

Projet universitaire réalisé dans le cadre du cours **INF1013 - Jalon II**.

WebResto est une application web de commande de repas en ligne développée avec une architecture microservices. Le backend est séparé en deux microservices Spring Boot et le frontend est développé avec Angular.

---

## Liens de déploiement

### Frontend Angular

https://webresto-frontend.onrender.com

### Microservice d'authentification

https://webresto-auth-service.onrender.com

### Microservice de logique métier

https://webresto-business-service.onrender.com

> Note : les services sont déployés sur Render avec le plan gratuit. Après une période d'inactivité, le premier chargement peut prendre quelques secondes, car les services doivent se réveiller.

---

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Technologies utilisées](#technologies-utilisées)
- [Structure du projet](#structure-du-projet)
- [Base de données](#base-de-données)
- [Configuration](#configuration)
- [Installation locale](#installation-locale)
- [API Reference](#api-reference)
- [Sécurité JWT](#sécurité-jwt)
- [Rôles utilisateurs](#rôles-utilisateurs)
- [Déploiement](#déploiement)
- [Tests effectués](#tests-effectués)
- [Auteur](#auteur)

---

## Vue d'ensemble

L'application WebResto permet aux utilisateurs de consulter des restaurants, créer un compte, se connecter, ajouter des plats au panier et passer des commandes.

Le projet est composé de trois parties principales :

| Composant | Description | Port local |
|---|---|---|
| `auth-service` | Gestion des utilisateurs, connexion, inscription et JWT | `8081` |
| `business_service` | Gestion des restaurants, plats, paniers et commandes | `8082` |
| `webresto` | Frontend Angular | `4200` |

---

## Architecture

```text
                    Frontend Angular
              https://webresto-frontend.onrender.com
                         |
                         |
        -------------------------------------
        |                                   |
        v                                   v
 auth-service                         business_service
 Authentification JWT                 Logique métier
 Port local : 8081                    Port local : 8082
        |                                   |
        |                                   |
        v                                   v
 Schema auth                         Schema business
                 PostgreSQL Render
                    webresto_db
```

Le projet respecte l'architecture demandée :

```text
Controller -> Service -> Repository
```

Les DTO et les modèles/entities sont séparés dans les deux microservices.

---

## Technologies utilisées

### Backend

| Technologie | Rôle |
|---|---|
| Java 17 | Langage backend |
| Spring Boot | Framework backend |
| Spring Security | Sécurité des endpoints |
| JWT | Authentification par token |
| Spring Data JPA | Accès aux données |
| Liquibase | Migrations de base de données |
| PostgreSQL | Base de données |
| Docker | Conteneurisation des microservices |

### Frontend

| Technologie | Rôle |
|---|---|
| Angular | Framework frontend |
| TypeScript | Langage frontend |
| HTML / SCSS | Interface utilisateur |
| Angular Material | Composants UI |

### Déploiement

| Technologie | Rôle |
|---|---|
| Render Web Service | Déploiement des microservices |
| Render Static Site | Déploiement du frontend Angular |
| Render PostgreSQL | Base de données en ligne |
| GitHub | Déploiement connecté à Render |
| dmigit.uqtr.ca | Remise du code |

---

## Structure du projet

```text
inf1013-jalon2-webrestau/
|
├── auth-service/
|   ├── src/
|   ├── Dockerfile
|   ├── pom.xml
|   └── Procfile
|
├── business_service/
|   ├── src/
|   ├── Dockerfile
|   ├── pom.xml
|   └── Procfile
|
├── webresto/
|   ├── src/
|   ├── angular.json
|   ├── package.json
|   └── ...
|
└── README.md
```

---

## Base de données

Le projet utilise une base PostgreSQL hébergée sur Render.

Pour respecter la séparation des données entre les microservices avec le plan gratuit de Render, une seule base PostgreSQL est utilisée avec deux schémas séparés :

```text
webresto_db
|
├── auth
└── business
```

### Schéma `auth`

Utilisé par le microservice `auth-service`.

Il contient les tables liées aux utilisateurs, à l'authentification et à la récupération de mot de passe.

### Schéma `business`

Utilisé par le microservice `business_service`.

Il contient les tables liées aux restaurants, catégories, plats, paniers et commandes.

Les migrations sont gérées automatiquement avec **Liquibase** au démarrage des microservices.

---

## Configuration

Le projet contient plusieurs fichiers de configuration Spring Boot.

### Configuration locale

```text
application.properties
```

Utilisée pour lancer les services localement avec PostgreSQL local.

### Configuration Render

```text
application-render.properties
```

Utilisée pour le déploiement en ligne sur Render.

Les microservices Render démarrent avec le profil :

```bash
-Dspring.profiles.active=render
```

### Configuration prod

```text
application-prod.properties
```

Ce fichier est conservé dans le projet, mais il n'est pas utilisé par Render. Render utilise uniquement le profil `render`.

---

## Variables d'environnement Render

### Variables communes aux deux microservices

```text
DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD
JWT_SECRET
CORS_ALLOWED_ORIGINS
```

### Variable supplémentaire pour `auth-service`

```text
JWT_EXPIRATION
```

### CORS utilisé en production

```text
CORS_ALLOWED_ORIGINS=http://localhost:4200,https://webresto-frontend.onrender.com
```

---

## Installation locale

### Prérequis

Avant de lancer le projet localement, il faut installer :

- Java 17 ou plus
- Maven
- PostgreSQL
- Node.js
- Angular CLI
- IntelliJ IDEA ou un autre IDE Java

---

### 1. Cloner le projet

```bash
git clone https://dmigit.uqtr.ca/mohamadk/inf1013-jalon2-webrestau.git
cd inf1013-jalon2-webrestau
```

---

### 2. Créer les bases PostgreSQL locales

Dans PostgreSQL local, créer les deux bases :

```sql
CREATE DATABASE auth_db;
CREATE DATABASE business_db;
```

---

### 3. Lancer `auth-service`

```bash
cd auth-service
mvn clean package -DskipTests
java -jar target/auth-service-1.0.0.jar
```

URL locale :

```text
http://localhost:8081
```

---

### 4. Lancer `business_service`

```bash
cd business_service
mvn clean package -DskipTests
java -jar target/business-service-1.0.0.jar
```

URL locale :

```text
http://localhost:8082
```

---

### 5. Lancer le frontend Angular

```bash
cd webresto
npm install
npm start
```

URL locale :

```text
http://localhost:4200
```

---

## API Reference

### Microservice Authentification

Base URL locale :

```text
http://localhost:8081/api/auth
```

Base URL déployée :

```text
https://webresto-auth-service.onrender.com/api/auth
```

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/register` | Créer un compte |
| `POST` | `/login` | Se connecter et recevoir un JWT |
| `POST` | `/forgot-password` | Demander une récupération de mot de passe |
| `POST` | `/reset-password` | Réinitialiser le mot de passe |
| `GET` | `/me` | Récupérer l'utilisateur connecté |
| `PUT` | `/profile` | Modifier le profil utilisateur |

Exemple de connexion :

```json
{
  "email": "client@example.com",
  "password": "motdepasse123"
}
```

Réponse attendue :

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "id": 1,
  "nom": "Client",
  "email": "client@example.com",
  "role": "CLIENT"
}
```

---

### Microservice Business

Base URL locale :

```text
http://localhost:8082/api
```

Base URL déployée :

```text
https://webresto-business-service.onrender.com/api
```

#### Restaurants

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/restaurants` | Liste des restaurants |
| `GET` | `/restaurants/{id}` | Détail d'un restaurant |
| `POST` | `/restaurants` | Créer un restaurant |
| `PUT` | `/restaurants/{id}` | Modifier un restaurant |
| `DELETE` | `/restaurants/{id}` | Supprimer un restaurant |

#### Plats

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/restaurants/{id}/plats` | Liste des plats d'un restaurant |
| `GET` | `/plats/{id}` | Détail d'un plat |
| `POST` | `/restaurants/{id}/plats` | Ajouter un plat |
| `PUT` | `/plats/{id}` | Modifier un plat |
| `DELETE` | `/plats/{id}` | Supprimer un plat |

#### Commandes

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/commandes` | Passer une commande |
| `GET` | `/commandes/mes-commandes` | Voir les commandes du client |
| `GET` | `/commandes/restaurant/{id}` | Voir les commandes d'un restaurant |
| `PUT` | `/commandes/{id}/accepter` | Accepter une commande |
| `PUT` | `/commandes/{id}/annuler` | Annuler une commande |
| `PUT` | `/commandes/{id}/prendre-en-charge` | Prendre en charge une livraison |
| `PUT` | `/commandes/{id}/livrer` | Marquer une commande comme livrée |

---

## Sécurité JWT

Le microservice `auth-service` génère le token JWT lors de la connexion.

Le microservice `business_service` valide ce token avec la même clé secrète JWT.

Le frontend Angular stocke le token et l'envoie dans les requêtes protégées avec l'en-tête :

```text
Authorization: Bearer <token>
```

Le token contient notamment :

```text
email
userId
role
expiration
```

---

## Rôles utilisateurs

| Rôle | Accès |
|---|---|
| `CLIENT` | Consulter les restaurants, ajouter au panier, passer des commandes |
| `RESTAURATEUR` | Gérer ses restaurants, ses plats et les commandes reçues |
| `LIVREUR` | Voir les commandes disponibles, prendre en charge une livraison |

---

## Déploiement

Le projet est déployé sur Render.

### Frontend Angular

Type Render :

```text
Static Site
```

Configuration :

```text
Root Directory: webresto
Build Command: npm install && npm run build
Publish Directory: dist/webresto/browser
```

URL :

```text
https://webresto-frontend.onrender.com
```

Une règle de rewrite est utilisée pour permettre le fonctionnement des routes Angular :

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

---

### Auth service

Type Render :

```text
Web Service Docker
```

Configuration :

```text
Root Directory: auth-service
Dockerfile Path: ./Dockerfile
Docker Build Context Directory: .
```

URL :

```text
https://webresto-auth-service.onrender.com
```

---

### Business service

Type Render :

```text
Web Service Docker
```

Configuration :

```text
Root Directory: business_service
Dockerfile Path: ./Dockerfile
Docker Build Context Directory: .
```

URL :

```text
https://webresto-business-service.onrender.com
```

---

## Docker

Chaque microservice possède un fichier Dockerfile.

```text
auth-service/Dockerfile
business_service/Dockerfile
```

Ces fichiers permettent à Render de compiler et lancer les microservices Spring Boot.

---

## Tests effectués

Les tests fonctionnels suivants ont été réalisés :

- Chargement du frontend en ligne
- Chargement de la page restaurants
- Affichage des restaurants depuis le business service
- Création de compte
- Connexion utilisateur
- Persistance de la session après rafraîchissement
- Accès aux pages protégées
- Ajout au panier
- Consultation des commandes
- Vérification des logs Render
- Vérification des schémas PostgreSQL `auth` et `business`

---

## Exigences respectées

Le projet respecte les exigences du Jalon II :

- Deux microservices Spring Boot
- Microservice d'authentification avec JWT
- Microservice de logique métier
- Utilisation de GET, POST, PUT et DELETE
- Architecture `controller -> service -> repository`
- Séparation DTO et modèles
- Migrations avec Liquibase
- Connexion du frontend avec les microservices
- Correction du problème CORS
- Déploiement en ligne des deux microservices
- Déploiement du frontend
- Remise du code sur dmigit.uqtr.ca

---

## Auteur

Projet réalisé par :

```text
Cheikh Khouma
Khadafi Hassan Mohamadou
Ezekiel Sthol Bertrand Djanfa Tchoukoua
```

Cours :

```text
INF1013 - Jalon II
Université du Québec à Trois-Rivières
```
