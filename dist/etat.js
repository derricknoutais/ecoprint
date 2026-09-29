import { LARGEUR_58MM } from "./metriques.js";
/**
 * Une erreur du terminal. Son `code` : ceux de l'état (`papier`, `capot`…),
 * plus `delai`, `image`, et `non-pris-en-charge` — étiquettes ou écran client
 * que ce terminal, ou cette version de l'application, ne sait pas faire.
 */
export class ErreurImpression extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'ErreurImpression';
        this.code = code;
    }
}
export const MESSAGE_ABSENTE = "Imprimante injoignable : l'application EcoPrint n'est pas ouverte sur ce terminal (ou ce n'est pas un terminal).";
export function etatAbsente() {
    return { code: 'absente', message: MESSAGE_ABSENTE, largeur: LARGEUR_58MM, transport: null };
}
/** L'état tel que l'application le décrit en JSON, complété et typé. */
export function lireEtat(brut, transport) {
    const e = (brut || {});
    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ code: e.code || 'erreur', message: e.message || '', largeur: e.largeur || LARGEUR_58MM }, (e.modele ? { modele: e.modele } : {})), (e.pilote ? { pilote: e.pilote } : {})), (e.terminal ? { terminal: e.terminal } : {})), (e.capacites ? { capacites: lireCapacites(e.capacites) } : {})), { transport });
}
function lireCapacites(brut) {
    const c = (brut || {});
    const a = c.afficheur;
    return {
        massicot: c.massicot === true,
        etiquettes: c.etiquettes === true ? true : c.etiquettes === false ? false : null,
        afficheur: a && Number(a.largeur) > 0 && Number(a.hauteur) > 0 ? { largeur: Number(a.largeur), hauteur: Number(a.hauteur) } : null,
    };
}
/** Le verdict d'impression de l'application : un résultat, ou une `ErreurImpression`. */
export function lireVerdict(brut) {
    const r = (brut || {});
    if (r.ok)
        return { simulation: !!r.simulation };
    throw new ErreurImpression(r.code || 'erreur', r.message || "L'impression a échoué.");
}
