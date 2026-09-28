/**
 * Par où passe l'impression :
 *  - `pont` : la page est ouverte DANS l'application EcoPrint, qui lui
 *    injecte `window.EcoPrint` ;
 *  - `serveur` : la page est ouverte dans le navigateur du terminal, et
 *    l'application, en service de fond, écoute sur http://127.0.0.1.
 */
export type Transport = 'pont' | 'serveur';
export type CodeEtat = 'prete' | 'papier' | 'surchauffe' | 'capot' | 'occupee' | 'erreur'
/** L'application refuse cette adresse : l'ajouter à ses adresses autorisées. */
 | 'refusee'
/** Ni pont ni service joignable : navigateur de bureau, ou application absente. */
 | 'absente'
/** L'application tourne sur un appareil sans imprimante reconnue : le reçu n'est pas imprimé. */
 | 'simulation';
export interface EtatImprimante {
    code: CodeEtat;
    message: string;
    /** Largeur imprimable en points, lue sur l'imprimante : 384 (58 mm) ou 576 (80 mm). */
    largeur: number;
    modele?: string;
    /** Le pilote choisi par l'application : `sunmi`, `zcs`, `simulation`. */
    pilote?: string;
    /** Le terminal reconnu : « SUNMI V2_PRO », « ZCS Z92S »… */
    terminal?: string;
    transport: Transport | null;
}
export interface ResultatImpression {
    /** Vrai si l'application tourne sans imprimante reconnue et n'a rien imprimé. */
    simulation: boolean;
}
export declare class ErreurImpression extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
export declare const MESSAGE_ABSENTE = "Imprimante injoignable : l'application EcoPrint n'est pas ouverte sur ce terminal (ou ce n'est pas un terminal).";
export declare function etatAbsente(): EtatImprimante;
/** L'état tel que l'application le décrit en JSON, complété et typé. */
export declare function lireEtat(brut: unknown, transport: Transport): EtatImprimante;
/** Le verdict d'impression de l'application : un résultat, ou une `ErreurImpression`. */
export declare function lireVerdict(brut: unknown): ResultatImpression;
