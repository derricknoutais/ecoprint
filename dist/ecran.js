var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { dessinerRecu, environnementNavigateur } from "./dessin.js";
import { ErreurImpression } from "./etat.js";
import { etatImprimante } from "./imprimer.js";
import { afficherParPont } from "./pont.js";
import { afficherAuServeur } from "./serveur.js";
/** Blanc gardé autour du contenu, en pixels. */
const MARGE = 16;
/**
 * Le contenu à la taille exacte de l'écran : dessiné à sa largeur, réduit
 * s'il est trop haut pour tenir — un client doit tout voir d'un coup —, et
 * centré.
 */
export function dessinerEcran(contenu_1, format_1) {
    return __awaiter(this, arguments, void 0, function* (contenu, format, env = environnementNavigateur()) {
        const page = yield dessinerRecu(contenu, { largeur: format.largeur, marge: MARGE, noirEtBlanc: false }, env);
        const toile = env.creerToile(format.largeur, format.hauteur);
        const ctx = toile.getContext('2d');
        if (!ctx)
            throw new Error('Canvas 2D indisponible.');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, format.largeur, format.hauteur);
        const hauteurUtile = format.hauteur - 2 * MARGE;
        const echelle = page.height > hauteurUtile ? hauteurUtile / page.height : 1;
        const largeur = Math.round(page.width * echelle);
        const hauteur = Math.round(page.height * echelle);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(page, Math.round((format.largeur - largeur) / 2), Math.round((format.hauteur - hauteur) / 2), largeur, hauteur);
        return toile;
    });
}
/**
 * Affiche le contenu sur l'écran client. Se rejette avec une
 * `ErreurImpression` : `non-pris-en-charge` si le terminal n'a pas d'écran
 * client, `absente` hors terminal, `refusee` si l'adresse n'est pas autorisée.
 */
export function afficherClient(contenu_1) {
    return __awaiter(this, arguments, void 0, function* (contenu, options = {}) {
        const etat = yield etatImprimante(options);
        if (!etat.transport || etat.code === 'refusee')
            throw new ErreurImpression(etat.code, etat.message);
        const format = etat.capacites ? etat.capacites.afficheur : null;
        if (!format) {
            throw new ErreurImpression('non-pris-en-charge', etat.capacites ? "Ce terminal n'a pas d'écran client." : "Cette version d'EcoPrint ne pilote pas l'écran client : la mettre à jour.");
        }
        const toile = yield dessinerEcran(contenu, format, options.environnement);
        const png = toile.toDataURL('image/png');
        const donnees = png.slice(png.indexOf(',') + 1);
        // Les transports rendent le verdict déjà lu : ils rejettent si l'écran refuse.
        if (etat.transport === 'pont')
            yield afficherParPont(donnees, { delai: options.delai });
        else
            yield afficherAuServeur(donnees, { port: options.port, delai: options.delai });
    });
}
/** Efface l'écran client. */
export function effacerClient() {
    return __awaiter(this, arguments, void 0, function* (options = {}) {
        const etat = yield etatImprimante(options);
        if (!etat.transport || etat.code === 'refusee')
            throw new ErreurImpression(etat.code, etat.message);
        if (etat.transport === 'pont')
            yield afficherParPont(null, { delai: options.delai });
        else
            yield afficherAuServeur(null, { port: options.port, delai: options.delai });
    });
}
