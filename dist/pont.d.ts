import { type EtatImprimante, type OptionsEnvoi, type ResultatImpression } from './etat.ts';
/**
 * Le pont direct : la page est ouverte DANS l'application EcoPrint, qui
 * l'affiche dans sa WebView et lui injecte `window.EcoPrint`. Ses
 * réponses, asynchrones, reviennent par `window.__ecoprint.retour`.
 */
/**
 * Version du protocole entre la page et l'application.
 * 2 : étiquettes (`support`, `copies`), écran client (`afficher`, `effacer`), capacités dans l'état.
 */
export declare const VERSION_PONT = "2";
/** Vrai si la page est ouverte dans l'application EcoPrint. */
export declare function pontDisponible(): boolean;
/** Version du protocole annoncée par l'application, ou `null` hors application. */
export declare function versionPont(): string | null;
/** L'état de l'imprimante par le pont — synchrone, c'est un appel direct. */
export declare function etatPont(): EtatImprimante;
/**
 * Envoie une image PNG (base64, sans le préfixe `data:`) à imprimer. Se
 * résout quand le reçu — ou la dernière étiquette — est SORTI.
 */
export declare function envoyerParPont(pngBase64: string, options?: OptionsEnvoi): Promise<ResultatImpression>;
/** Affiche une image PNG (base64) sur l'écran client — ou l'efface si elle vaut `null`. */
export declare function afficherParPont(pngBase64: string | null, options?: {
    delai?: number;
}): Promise<ResultatImpression>;
