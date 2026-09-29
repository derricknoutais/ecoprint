import { type PropType, type Ref } from 'vue';
import type { Recu } from './document.ts';
import { type EtatImprimante } from './etat.ts';
import { type OptionsEcran } from './ecran.ts';
import { type OptionsImpression } from './imprimer.ts';
import type { OptionsServeur } from './serveur.ts';
/**
 * Imprimer depuis un composant Vue 3.
 *
 * Une simple enveloppe : tout vit dans `imprimerRecu`, `etatImprimante` et
 * `apercuRecu`, utilisables tels quels en Vue 2, Alpine ou sans framework.
 */
export declare function useImprimante(options?: OptionsServeur & {
    detecterAuMontage?: boolean;
}): {
    /** Le dernier état connu ; `null` tant que rien n'a été détecté. */
    etat: Ref<EtatImprimante | null>;
    enCours: Ref<boolean>;
    /** Message de la dernière erreur, prêt à afficher ; `null` après un succès. */
    erreur: Ref<string | null>;
    /** Se résout à `true` si le reçu est sorti. Un second appel pendant l'impression est ignoré. */
    imprimer: (recu: Recu, autres?: OptionsImpression) => Promise<boolean>;
    detecter: () => Promise<EtatImprimante>;
};
/**
 * L'écran client depuis un composant Vue 3 : `afficher(contenu)` montre le
 * panier, le total, un QR… — les mêmes blocs qu'un reçu —, `effacer()` le vide.
 *
 * Fait pour être appelé à chaque changement du panier : les demandes passent
 * une à une, et seule la plus récente est envoyée — un écran ne montre jamais
 * un panier plus ancien que le dernier. Sans écran client (terminal sans second
 * écran, navigateur de bureau), ce n'est pas une erreur : `disponible` passe à
 * `false` et les appels suivants ne coûtent plus rien — pas même une requête
 * vers le service local, qu'un Chrome de bureau ferait valider à l'utilisateur.
 */
export declare function useEcranClient(options?: OptionsEcran): {
    /** `null` tant qu'on n'a rien affiché, puis s'il y a un écran client joignable. */
    disponible: Ref<boolean | null>;
    enCours: Ref<boolean>;
    /** Message de la dernière erreur ; `null` après un succès. */
    erreur: Ref<string | null>;
    /** Se résout à `true` si l'écran affiche ce contenu ; `false` sinon, ou s'il a été remplacé par un plus récent avant d'être envoyé. */
    afficher: (contenu: Recu) => Promise<boolean>;
    effacer: () => Promise<boolean>;
};
/**
 * L'aperçu d'un reçu, pixel pour pixel ce qui sortira de l'imprimante.
 *
 *   <ApercuRecu :recu="recu" />
 */
export declare const ApercuRecu: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    recu: {
        type: PropType<Recu>;
        required: true;
    };
    /** En points ; 384 (58 mm) par défaut. */
    largeur: {
        type: NumberConstructor;
        default: undefined;
    };
}>, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    recu: {
        type: PropType<Recu>;
        required: true;
    };
    /** En points ; 384 (58 mm) par défaut. */
    largeur: {
        type: NumberConstructor;
        default: undefined;
    };
}>> & Readonly<{}>, {
    largeur: number;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
