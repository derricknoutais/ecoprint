import { ErreurImpression, etatAbsente, lireEtat, lireVerdict } from "./etat.js";
/**
 * Le pont direct : la page est ouverte DANS l'application EcoPrint, qui
 * l'affiche dans sa WebView et lui injecte `window.EcoPrint`. Ses
 * réponses, asynchrones, reviennent par `window.__ecoprint.retour`.
 */
/**
 * Version du protocole entre la page et l'application.
 * 2 : étiquettes (`support`, `copies`), écran client (`afficher`, `effacer`), capacités dans l'état.
 */
export const VERSION_PONT = '2';
function fenetre() {
    return typeof window === 'undefined' ? null : window;
}
function pont() {
    const f = fenetre();
    return f && f.EcoPrint ? f.EcoPrint : null;
}
/** Vrai si la page est ouverte dans l'application EcoPrint. */
export function pontDisponible() {
    return pont() !== null;
}
/** Version du protocole annoncée par l'application, ou `null` hors application. */
export function versionPont() {
    const p = pont();
    return p ? String(p.version()) : null;
}
/** L'état de l'imprimante par le pont — synchrone, c'est un appel direct. */
export function etatPont() {
    const p = pont();
    if (!p)
        return etatAbsente();
    try {
        return lireEtat(JSON.parse(p.etat()), 'pont');
    }
    catch (e) {
        return lireEtat({ code: 'erreur', message: `Réponse illisible de l'application : ${String(e)}` }, 'pont');
    }
}
/**
 * Envoie une image PNG (base64, sans le préfixe `data:`) à imprimer. Se
 * résout quand le reçu — ou la dernière étiquette — est SORTI.
 */
export function envoyerParPont(pngBase64, options = {}) {
    const details = JSON.stringify({
        avance: options.avance === undefined ? 3 : options.avance,
        support: options.support || 'recu',
        copies: options.copies || 1,
    });
    return demander((p, id) => p.imprimer(id, pngBase64, details), options.delai || 60000, "L'imprimante n'a pas répondu");
}
/** Affiche une image PNG (base64) sur l'écran client — ou l'efface si elle vaut `null`. */
export function afficherParPont(pngBase64, options = {}) {
    const p = pont();
    if (p && (typeof p.afficher !== 'function' || typeof p.effacer !== 'function')) {
        return Promise.reject(new ErreurImpression('non-pris-en-charge', "Cette version d'EcoPrint ne pilote pas l'écran client : la mettre à jour."));
    }
    return demander((natif, id) => (pngBase64 === null ? natif.effacer(id) : natif.afficher(id, pngBase64)), options.delai || 15000, "L'écran client n'a pas répondu");
}
let compteur = 0;
/** Un appel au pont, et la promesse de sa réponse, bornée dans le temps. */
function demander(appel, delai, sansReponse) {
    const f = fenetre();
    const p = pont();
    if (!f || !p)
        return Promise.reject(new ErreurImpression('absente', etatAbsente().message));
    const retours = installerRetours(f);
    const id = `i${Date.now().toString(36)}-${++compteur}`;
    return new Promise((resoudre, rejeter) => {
        const minuteur = setTimeout(() => {
            retours.attentes.delete(id);
            rejeter(new ErreurImpression('delai', `${sansReponse} en ${Math.round(delai / 1000)} s.`));
        }, delai);
        retours.attentes.set(id, { resoudre, rejeter, minuteur });
        try {
            appel(p, id);
        }
        catch (e) {
            clearTimeout(minuteur);
            retours.attentes.delete(id);
            rejeter(new ErreurImpression('erreur', `L'application a refusé la demande : ${e instanceof Error ? e.message : String(e)}`));
        }
    });
}
function installerRetours(f) {
    if (!f.__ecoprint) {
        const attentes = new Map();
        f.__ecoprint = {
            attentes,
            retour(id, resultat) {
                const attente = attentes.get(id);
                // Réponse arrivée après le délai : la promesse est déjà rejetée.
                if (!attente)
                    return;
                attentes.delete(id);
                clearTimeout(attente.minuteur);
                try {
                    attente.resoudre(lireVerdict(JSON.parse(resultat)));
                }
                catch (e) {
                    attente.rejeter(e instanceof ErreurImpression ? e : new ErreurImpression('erreur', "Réponse illisible de l'application."));
                }
            },
        };
    }
    return f.__ecoprint;
}
