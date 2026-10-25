const Peso_Clase = { A: 3, B: 2, C: 1 };

function valorVisita(local, diaActual) {
    const urgencia = 
      local.diasParaVencer == null ? 0 : Math.max(0, 10 - local.diasParaVencer);
    const atraso = Math.max(
        0,
        diaActual - local.ultimaVisitaDia - local.frecuenciaDias
    );
    return 3 * urgencia + 1 * atraso + 1.5 * Peso_Clase[local.clase];
}

module.exports = { Peso_Clase, valorVisita};