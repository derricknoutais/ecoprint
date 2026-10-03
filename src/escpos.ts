import type { Toile } from './dessin.ts';
import { niveauxDeGris } from './tramage.ts';

const ESC = 0x1b;
const GS = 0x1d;

/** Lignes par commande GS v 0 : les imprimantes d'entrée de gamme saturent au-delà. */
const BANDE = 255;

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
export function tiroirEscPos(broche: 2 | 5 = 2): Uint8Array {
    return Uint8Array.from([ESC, 0x70, broche === 5 ? 1 : 0, 25, 250]);
}

/**
 * Le reçu dessiné, en commandes ESC/POS « image tramée » (GS v 0), pour une
 * imprimante thermique autre que celle du terminal : réseau, Bluetooth, USB.
 *
 * Toutes comprennent cette commande, et l'image contourne leurs pages de
 * codes : les accents et « FCFA » sortent exactement comme à l'aperçu, ce que
 * du texte envoyé en UTF-8 ne garantit sur aucune.
 */
export function versEscPos(toile: Toile, options: OptionsEscPos = {}): Uint8Array {
    const ctx = toile.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D indisponible.');
    const gris = niveauxDeGris(ctx.getImageData(0, 0, toile.width, toile.height).data);
    return rasterEscPos((x, y) => gris[y * toile.width + x] < 128, toile.width, toile.height, options);
}

/** Les mêmes commandes, à partir de n'importe quelle source de points. */
export function rasterEscPos(
    estNoir: (x: number, y: number) => boolean,
    largeur: number,
    hauteur: number,
    options: OptionsEscPos = {},
): Uint8Array {
    const octetsParLigne = Math.ceil(largeur / 8);
    const sortie: number[] = [];

    if (options.initialiser !== false) sortie.push(ESC, 0x40);
    // En tête : le tiroir s'ouvre pendant que le reçu s'imprime.
    if (options.tiroir) sortie.push(...Array.from(tiroirEscPos()));

    for (let debut = 0; debut < hauteur; debut += BANDE) {
        const lignes = Math.min(BANDE, hauteur - debut);
        // GS v 0 m xL xH yL yH : largeur en octets, hauteur en lignes.
        sortie.push(GS, 0x76, 0x30, 0x00, octetsParLigne & 0xff, octetsParLigne >> 8, lignes & 0xff, lignes >> 8);

        for (let y = debut; y < debut + lignes; y++) {
            for (let o = 0; o < octetsParLigne; o++) {
                let octet = 0;
                for (let bit = 0; bit < 8; bit++) {
                    const x = o * 8 + bit;
                    // Bit de poids fort = point le plus à gauche ; 1 = chauffer.
                    if (x < largeur && estNoir(x, y)) octet |= 0x80 >> bit;
                }
                sortie.push(octet);
            }
        }
    }

    // ESC d n : imprimer et avancer de n lignes, pour détacher le reçu.
    const avance = options.avance === undefined ? 4 : Math.max(0, Math.min(255, Math.round(options.avance)));
    if (avance > 0) sortie.push(ESC, 0x64, avance);

    return Uint8Array.from(sortie);
}
