import { LARGEUR_58MM } from "./metriques.js";
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
    return Object.assign(Object.assign(Object.assign(Object.assign({ code: e.code || 'erreur', message: e.message || '', largeur: e.largeur || LARGEUR_58MM }, (e.modele ? { modele: e.modele } : {})), (e.pilote ? { pilote: e.pilote } : {})), (e.terminal ? { terminal: e.terminal } : {})), { transport });
}
/** Le verdict d'impression de l'application : un résultat, ou une `ErreurImpression`. */
export function lireVerdict(brut) {
    const r = (brut || {});
    if (r.ok)
        return { simulation: !!r.simulation };
    throw new ErreurImpression(r.code || 'erreur', r.message || "L'impression a échoué.");
}
