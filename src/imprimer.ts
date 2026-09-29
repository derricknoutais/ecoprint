import type { Recu } from './document.ts';
import { dessinerRecu, type Environnement, type OptionsDessin, type Toile } from './dessin.ts';
import { ErreurImpression, etatAbsente, type EtatImprimante, type OptionsEnvoi, type ResultatImpression } from './etat.ts';
import { LARGEUR_58MM } from './metriques.ts';
import { envoyerParPont, etatPont, pontDisponible } from './pont.ts';
import { envoyerAuServeur, etatServeur, type OptionsServeur } from './serveur.ts';

export interface OptionsImpression extends OptionsDessin, OptionsServeur, OptionsEnvoi {
    /** Où dessiner, hors navigateur : les tests passent celui de Node. */
    environnement?: Environnement;
}

/**
 * L'état de l'imprimante, par le chemin disponible : le pont si la page est
 * ouverte dans l'application, sinon le service local, sinon « absente ».
 */
export async function etatImprimante(options: OptionsServeur = {}): Promise<EtatImprimante> {
    if (pontDisponible()) return etatPont();
    return (await etatServeur(options)) || etatAbsente();
}

/**
 * Dessine le reçu et l'imprime. Se résout quand il est sorti ; se rejette avec
 * une `ErreurImpression` dont le `code` dit quoi faire : `papier`, `capot`,
 * `surchauffe`, `refusee` (adresse à autoriser dans l'application), `absente`…
 */
export async function imprimerRecu(recu: Recu, options: OptionsImpression = {}): Promise<ResultatImpression> {
    // Vérifié AVANT de dessiner : inutile de faire attendre le caissier pour
    // lui dire ensuite qu'il n'y a plus de papier.
    const etat = await etatImprimante(options);
    if (!etat.transport || (etat.code !== 'prete' && etat.code !== 'simulation')) {
        throw new ErreurImpression(etat.code, etat.message);
    }
    if (options.support === 'etiquette' && etat.capacites && etat.capacites.etiquettes === false) {
        throw new ErreurImpression('non-pris-en-charge', "L'imprimante de ce terminal n'imprime pas d'étiquettes.");
    }

    const toile = await dessinerRecu(recu, { ...options, largeur: options.largeur || etat.largeur }, options.environnement);
    const png = toile.toDataURL('image/png');
    const donnees = png.slice(png.indexOf(',') + 1);

    const envoi: OptionsEnvoi = { avance: options.avance, support: options.support, copies: options.copies, delai: options.delai };
    return etat.transport === 'pont' ? envoyerParPont(donnees, envoi) : envoyerAuServeur(donnees, { ...envoi, port: options.port });
}

/**
 * Le reçu tel qu'il sortira, en canvas noir et blanc. Sans recherche de
 * l'imprimante : à la largeur du pont s'il y en a un, en 58 mm sinon — un
 * aperçu ne doit pas attendre le réseau.
 */
export function apercuRecu(recu: Recu, options: OptionsDessin = {}, env?: Environnement): Promise<Toile> {
    const largeur = options.largeur || (pontDisponible() ? etatPont().largeur : LARGEUR_58MM);
    return dessinerRecu(recu, { ...options, largeur }, env);
}
