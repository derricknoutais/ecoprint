import { LARGEUR_58MM } from './metriques.ts';

/**
 * Par où passe l'impression :
 *  - `pont` : la page est ouverte DANS l'application EcoPrint, qui lui
 *    injecte `window.EcoPrint` ;
 *  - `serveur` : la page est ouverte dans le navigateur du terminal, et
 *    l'application, en service de fond, écoute sur http://127.0.0.1.
 */
export type Transport = 'pont' | 'serveur';

export type CodeEtat =
    | 'prete'
    | 'papier'
    | 'surchauffe'
    | 'capot'
    | 'occupee'
    | 'erreur'
    /** L'application refuse cette adresse : l'ajouter à ses adresses autorisées. */
    | 'refusee'
    /** Ni pont ni service joignable : navigateur de bureau, ou application absente. */
    | 'absente'
    /** L'application tourne sur un appareil sans imprimante reconnue : le reçu n'est pas imprimé. */
    | 'simulation';

/** Ce que le terminal sait faire, tel que le dit son pilote. */
export interface Capacites {
    /** Un massicot coupe le reçu après l'impression. */
    massicot: boolean;
    /** Papier étiquette accepté ; `null` quand le pilote ne peut pas le savoir d'avance (ZCS : l'essai tranche). */
    etiquettes: boolean | null;
    /** L'écran tourné vers le client, s'il y en a un. */
    afficheur: FormatEcran | null;
}

export interface FormatEcran {
    largeur: number;
    hauteur: number;
}

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
    /** Absent avec une application EcoPrint antérieure au protocole 2. */
    capacites?: Capacites;
    transport: Transport | null;
}

/** Ce qu'un transport transmet avec l'image à imprimer. */
export interface OptionsEnvoi {
    /** Lignes blanches sous un reçu, pour le détacher à la barre ou au massicot ; 3 par défaut. */
    avance?: number;
    /** `etiquette` : papier étiquette, l'image est une étiquette ; `recu` par défaut. */
    support?: 'recu' | 'etiquette';
    /** Exemplaires d'une étiquette ; 1 par défaut. */
    copies?: number;
    /** Attente maximale du verdict, en ms. */
    delai?: number;
}

export interface ResultatImpression {
    /** Vrai si l'application tourne sans imprimante reconnue et n'a rien imprimé. */
    simulation: boolean;
}

/**
 * Une erreur du terminal. Son `code` : ceux de l'état (`papier`, `capot`…),
 * plus `delai`, `image`, et `non-pris-en-charge` — étiquettes ou écran client
 * que ce terminal, ou cette version de l'application, ne sait pas faire.
 */
export class ErreurImpression extends Error {
    readonly code: string;

    constructor(code: string, message: string) {
        super(message);
        this.name = 'ErreurImpression';
        this.code = code;
    }
}

export const MESSAGE_ABSENTE =
    "Imprimante injoignable : l'application EcoPrint n'est pas ouverte sur ce terminal (ou ce n'est pas un terminal).";

export function etatAbsente(): EtatImprimante {
    return { code: 'absente', message: MESSAGE_ABSENTE, largeur: LARGEUR_58MM, transport: null };
}

/** L'état tel que l'application le décrit en JSON, complété et typé. */
export function lireEtat(brut: unknown, transport: Transport): EtatImprimante {
    const e = (brut || {}) as Partial<EtatImprimante>;
    return {
        code: e.code || 'erreur',
        message: e.message || '',
        largeur: e.largeur || LARGEUR_58MM,
        ...(e.modele ? { modele: e.modele } : {}),
        ...(e.pilote ? { pilote: e.pilote } : {}),
        ...(e.terminal ? { terminal: e.terminal } : {}),
        ...(e.capacites ? { capacites: lireCapacites(e.capacites) } : {}),
        transport,
    };
}

function lireCapacites(brut: unknown): Capacites {
    const c = (brut || {}) as { massicot?: unknown; etiquettes?: unknown; afficheur?: { largeur?: unknown; hauteur?: unknown } | null };
    const a = c.afficheur;
    return {
        massicot: c.massicot === true,
        etiquettes: c.etiquettes === true ? true : c.etiquettes === false ? false : null,
        afficheur: a && Number(a.largeur) > 0 && Number(a.hauteur) > 0 ? { largeur: Number(a.largeur), hauteur: Number(a.hauteur) } : null,
    };
}

/** Le verdict d'impression de l'application : un résultat, ou une `ErreurImpression`. */
export function lireVerdict(brut: unknown): ResultatImpression {
    const r = (brut || {}) as { ok?: boolean; code?: string; message?: string; simulation?: boolean };
    if (r.ok) return { simulation: !!r.simulation };
    throw new ErreurImpression(r.code || 'erreur', r.message || "L'impression a échoué.");
}
