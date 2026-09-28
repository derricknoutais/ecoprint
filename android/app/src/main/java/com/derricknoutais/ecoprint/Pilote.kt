package com.derricknoutais.ecoprint

import android.content.Context
import android.graphics.Bitmap
import android.os.Build
import com.derricknoutais.sunmiprint.ImprimanteSunmi
import com.derricknoutais.zcsprint.ImprimanteZcs
import org.json.JSONObject

/**
 * Ce qu'EcoPrint attend d'un pilote d'imprimante.
 *
 * Chaque marque a le sien, dans son propre dépôt — sunmi-print, zcs-print —,
 * sans rien savoir d'EcoPrint : ils parlent le même vocabulaire JSON
 * (`{code, message, largeur, modele}`, `{ok}` ou `{ok: false, code, message}`),
 * et ces quelques lignes les branchent sur l'application.
 */
interface Pilote {
    /** `sunmi`, `zcs`, `simulation` : ce que la page lit dans l'état. */
    val nom: String

    fun etat(): JSONObject

    /** Imprime l'image et appelle `fini` une seule fois, avec le verdict de l'imprimante. */
    fun imprimer(image: Bitmap, avance: Int, fini: (JSONObject) -> Unit)

    fun arreter()
}

private class PiloteSunmi(private val imprimante: ImprimanteSunmi) : Pilote {
    override val nom = "sunmi"
    override fun etat() = imprimante.etat()
    override fun imprimer(image: Bitmap, avance: Int, fini: (JSONObject) -> Unit) = imprimante.imprimer(image, avance, fini)
    override fun arreter() = imprimante.arreter()
}

private class PiloteZcs(private val imprimante: ImprimanteZcs) : Pilote {
    override val nom = "zcs"
    override fun etat() = imprimante.etat()
    override fun imprimer(image: Bitmap, avance: Int, fini: (JSONObject) -> Unit) = imprimante.imprimer(image, avance, fini)
    override fun arreter() = imprimante.arreter()
}

/**
 * Aucun pilote ne reconnaît l'appareil : téléphone, émulateur, ou marque pas
 * encore prise en charge. Rien n'est imprimé ; l'application montre le reçu
 * (pont) ou le garde en fichier (service local).
 */
class PiloteSimulation : Pilote {
    override val nom = SIMULATION
    override fun etat(): JSONObject = JSONObject()
        .put("code", "simulation")
        .put("message", "Aucune imprimante reconnue sur ${Pilotes.terminal()} : simulation, rien ne sera imprimé.")
        .put("largeur", Pilotes.LARGEUR_58MM)

    override fun imprimer(image: Bitmap, avance: Int, fini: (JSONObject) -> Unit) = fini(JSONObject().put("ok", true).put("simulation", true))
    override fun arreter() {}

    companion object {
        const val SIMULATION = "simulation"
    }
}

object Pilotes {
    const val LARGEUR_58MM = 384

    /**
     * Reconnaît le terminal et choisit son pilote. ZCS d'abord : son pilote ne
     * se déclare que sur un terminal ZCS. Puis Sunmi : son pilote se déclare
     * partout où le service d'impression Sunmi existe — y compris chez les
     * marques qui l'ont repris.
     */
    fun choisir(contexte: Context): Pilote {
        val zcs = ImprimanteZcs()
        if (zcs.demarrer()) return PiloteZcs(zcs)

        val sunmi = ImprimanteSunmi(contexte.applicationContext)
        if (sunmi.demarrer()) return PiloteSunmi(sunmi)

        return PiloteSimulation()
    }

    /** « SUNMI V2_PRO », « ZCS Z92S »… */
    fun terminal(): String = "${Build.MANUFACTURER.uppercase()} ${Build.MODEL}".trim()
}
