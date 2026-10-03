import type { Toile } from './dessin.ts';
/** Options de `versEscPos` et `rasterEscPos`. */
export interface OptionsEscPos {
    /** Lignes d'avance après le reçu ; 4 par défaut. */
    avance?: number;
    /** `ESC @` en tête ; vrai par défaut. */
    initialiser?: boolean;
    /** Ouvrir le tiroir-caisse branché sur l'imprimante, avant le reçu. */
    tiroir?: boolean;
}
/**
 * `ESC p m t1 t2` : une impulsion sur la prise du tiroir-caisse de
 * l'imprimante — broche 2 (`m` = 0, la plus courante) ou 5 (`m` = 1) —, 50 ms
 * d'impulsion, 500 ms de repos.
 */
export declare function tiroirEscPos(broche?: 2 | 5): Uint8Array;
/**
 * Le reçu dessiné, en commandes ESC/POS « image tramée » (GS v 0), pour une
 * imprimante thermique autre que celle du terminal : réseau, Bluetooth, USB.
 *
 * Toutes comprennent cette commande, et l'image contourne leurs pages de
 * codes : les accents et « FCFA » sortent exactement comme à l'aperçu, ce que
 * du texte envoyé en UTF-8 ne garantit sur aucune.
 */
export declare function versEscPos(toile: Toile, options?: OptionsEscPos): Uint8Array;
/** Les mêmes commandes, à partir de n'importe quelle source de points. */
export declare function rasterEscPos(estNoir: (x: number, y: number) => boolean, largeur: number, hauteur: number, options?: OptionsEscPos): Uint8Array;
