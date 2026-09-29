import type { Recu } from './document.ts';
import { dessinerRecu, environnementNavigateur, type Environnement, type Toile } from './dessin.ts';
import { ErreurImpression, type FormatEcran } from './etat.ts';
import { etatImprimante } from './imprimer.ts';
import { afficherParPont } from './pont.ts';
import { afficherAuServeur, type OptionsServeur } from './serveur.ts';

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

/** Blanc gardé autour du contenu, en pixels. */
const MARGE = 16;

/**
 * Le contenu à la taille exacte de l'écran : dessiné à sa largeur, réduit
 * s'il est trop haut pour tenir — un client doit tout voir d'un coup —, et
 * centré.
 */
export async function dessinerEcran(contenu: Recu, format: FormatEcran, env: Environnement = environnementNavigateur()): Promise<Toile> {
    const page = await dessinerRecu(contenu, { largeur: format.largeur, marge: MARGE, noirEtBlanc: false }, env);

    const toile = env.creerToile(format.largeur, format.hauteur);
    const ctx = toile.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D indisponible.');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, format.largeur, format.hauteur);

    const hauteurUtile = format.hauteur - 2 * MARGE;
    const echelle = page.height > hauteurUtile ? hauteurUtile / page.height : 1;
    const largeur = Math.round(page.width * echelle);
    const hauteur = Math.round(page.height * echelle);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(page as unknown as CanvasImageSource, Math.round((format.largeur - largeur) / 2), Math.round((format.hauteur - hauteur) / 2), largeur, hauteur);
    return toile;
}

/**
 * Affiche le contenu sur l'écran client. Se rejette avec une
 * `ErreurImpression` : `non-pris-en-charge` si le terminal n'a pas d'écran
 * client, `absente` hors terminal, `refusee` si l'adresse n'est pas autorisée.
 */
export async function afficherClient(contenu: Recu, options: OptionsEcran = {}): Promise<void> {
    const etat = await etatImprimante(options);
    if (!etat.transport || etat.code === 'refusee') throw new ErreurImpression(etat.code, etat.message);

    const format = etat.capacites ? etat.capacites.afficheur : null;
    if (!format) {
        throw new ErreurImpression(
            'non-pris-en-charge',
            etat.capacites ? "Ce terminal n'a pas d'écran client." : "Cette version d'EcoPrint ne pilote pas l'écran client : la mettre à jour.",
        );
    }

    const toile = await dessinerEcran(contenu, format, options.environnement);
    const png = toile.toDataURL('image/png');
    const donnees = png.slice(png.indexOf(',') + 1);

    // Les transports rendent le verdict déjà lu : ils rejettent si l'écran refuse.
    if (etat.transport === 'pont') await afficherParPont(donnees, { delai: options.delai });
    else await afficherAuServeur(donnees, { port: options.port, delai: options.delai });
}

/** Efface l'écran client. */
export async function effacerClient(options: OptionsEcran = {}): Promise<void> {
    const etat = await etatImprimante(options);
    if (!etat.transport || etat.code === 'refusee') throw new ErreurImpression(etat.code, etat.message);
    if (etat.transport === 'pont') await afficherParPont(null, { delai: options.delai });
    else await afficherAuServeur(null, { port: options.port, delai: options.delai });
}
