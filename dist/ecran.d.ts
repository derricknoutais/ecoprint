import type { Recu } from './document.ts';
import { type Environnement, type Toile } from './dessin.ts';
import { type FormatEcran } from './etat.ts';
import { type OptionsServeur } from './serveur.ts';
/**
 * L'écran client : le petit écran tourné vers le client, sur les terminaux
 * qui en ont un (ZCS à double écran : 480 × 480).
 *
 * On y montre ce qu'on veut — le panier, le total à payer, un QR de
 * paiement, le logo de la boutique — avec les MÊMES blocs qu'un reçu. Le
 * paquet le dessine à la taille de l'écran, en niveaux de gris cette fois
 * (un écran n'est pas une tête thermique), et l'application l'y affiche.
 */
export interface OptionsEcran extends OptionsServeur {
    /** Attente maximale de l'écran, en ms ; 15 000 par défaut. */
    delai?: number;
    /** Où dessiner, hors navigateur : les tests passent celui de Node. */
    environnement?: Environnement;
}
/**
 * Le contenu à la taille exacte de l'écran : dessiné à sa largeur, réduit
 * s'il est trop haut pour tenir — un client doit tout voir d'un coup —, et
 * centré.
 */
export declare function dessinerEcran(contenu: Recu, format: FormatEcran, env?: Environnement): Promise<Toile>;
/**
 * Affiche le contenu sur l'écran client. Se rejette avec une
 * `ErreurImpression` : `non-pris-en-charge` si le terminal n'a pas d'écran
 * client, `absente` hors terminal, `refusee` si l'adresse n'est pas autorisée.
 */
export declare function afficherClient(contenu: Recu, options?: OptionsEcran): Promise<void>;
/** Efface l'écran client. */
export declare function effacerClient(options?: OptionsEcran): Promise<void>;
