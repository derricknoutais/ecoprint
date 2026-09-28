package com.derricknoutais.ecoprint

import android.app.Application
import org.json.JSONObject

/**
 * Un seul pilote pour toute l'application : le service local et la WebView
 * impriment par la même file, et deux reçus ne s'entrelacent jamais.
 */
class EcoPrintApp : Application() {

    val reglages by lazy { Reglages(this) }

    /** Le pilote du terminal, reconnu une fois pour toutes au premier usage. */
    val pilote: Pilote by lazy { Pilotes.choisir(this) }

    /** L'état de l'imprimante, avec le pilote choisi et le terminal reconnu. */
    fun etat(): JSONObject = pilote.etat().put("pilote", pilote.nom).put("terminal", Pilotes.terminal())

    val simulation: Boolean get() = pilote.nom == PiloteSimulation.SIMULATION
}
