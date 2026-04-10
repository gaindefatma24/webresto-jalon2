/**
 * ================================================================
 * Modèles de données — WebResto
 * ================================================================
 * Tous les types TypeScript utilisés dans l'application.
 * Ces interfaces correspondent exactement aux entités qui
 * seront des @Entity JPA dans les microservices Spring Boot.
 * ================================================================
 */

/**
 * Rôles utilisateur.
 * Chaque rôle donne accès à des fonctionnalités différentes :
 * - CLIENT       → Parcourir, commander, suivre ses commandes
 * - RESTAURATEUR → Gérer ses restaurants, plats et commandes reçues
 * - LIVREUR      → Voir les commandes disponibles, livrer
 */
export enum Role {
  CLIENT       = 'CLIENT',
  RESTAURATEUR = 'RESTAURATEUR',
  LIVREUR      = 'LIVREUR'
}

/**
 * Cycle de vie d'une commande :
 * EN_ATTENTE → EN_PREPARATION → EN_LIVRAISON → LIVREE
 *           ↘ ANNULEE (par client ou restaurateur)
 */
export enum StatutCommande {
  EN_ATTENTE    = 'EN_ATTENTE',
  EN_PREPARATION = 'EN_PREPARATION',
  EN_LIVRAISON  = 'EN_LIVRAISON',
  LIVREE        = 'LIVREE',
  ANNULEE       = 'ANNULEE'
}

/** Utilisateur de l'application (client, restaurateur ou livreur) */
export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  password?: string;     // Optionnel : non stocké dans la session
  role: Role;
  adresse: string;
  telephone?: string;
}

/** Catégorie de cuisine (Pizzeria, Sushi, Burger...) */
export interface Categorie {
  id: number;
  nom: string;
  icon: string;          // Emoji représentant la catégorie
  count: number;         // Nombre de restaurants dans la catégorie
}

/** Restaurant enregistré dans la plateforme */
export interface Restaurant {
  id: number;
  nom: string;
  description: string;
  adresse: string;
  ville: string;
  telephone: string;
  categorieId: number;
  categorie: string;     // Nom de la catégorie (dénormalisé pour l'affichage)
  imageUrl: string;
  proprietaireId?: number; // ID du restaurateur propriétaire
}

/** Plat proposé par un restaurant */
export interface Plat {
  id: number;
  nom: string;
  description: string;
  prix: number;
  imageUrl: string;
  restaurantId: number;  // Clé étrangère vers Restaurant
  disponible?: boolean;  // true = disponible à la commande
}

/** Élément dans le panier (avant passage de commande) */
export interface CartItem {
  plat: Plat;
  quantite: number;
}

/** Ligne d'une commande (un plat + quantité + prix au moment de la commande) */
export interface LigneCommande {
  platId: number;
  nomPlat: string;
  quantite: number;
  prixUnitaire: number;  // Prix au moment de la commande (peut changer après)
  sousTotal: number;     // prixUnitaire × quantite
}

/** Commande complète */
export interface Commande {
  id: number;
  clientId: number;
  clientNom: string;
  restaurantId: number;
  restaurantNom: string;
  lignes: LigneCommande[];
  statut: StatutCommande;
  adresseLivraison: string;
  total: number;
  date: string;          // Format: "2025-02-10 18:34"
  livreurId?: number;    // Assigné quand un livreur prend la commande
  livreurNom?: string;
}
