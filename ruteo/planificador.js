const { trasladoMin, hhmm } = require("./tiempo_distancia");
const { valorVisita } = require("./prioridad");
const { inicioPosible } = require("./ventanas");

const Dias_Urgente = 3;

function esUrgente(local) {
    return local.diasParaVencer != null && local.diasParaVencer <= Dias_Urgente;
}

function esperaMaximaMin(local) {
    return esUrgente(local) ? 240 : 30;
}

function puedeLlegarA(desdePos, desdeT, local, finJornada) {
    const llegada = desdeT + trasladoMin(desdePos, local);
    const inicio = inicioPosible(local.ventanas, llegada, local.tiempoVisitaMin);
    if (inicio === null) return false;
    if (inicio - llegada > esperaMaximaMin(local)) return false;
    return inicio + local.tiempoVisitaMin <= finJornada;
}

function planificarRepositor(repo, locales, diaActual) {
    const finJornada = repo.horaInicio + repo.jornadaMin;
    let pos = repo.inicio;
    let t = repo.horaInicio;
    const pendientes = new Set(locales.filter((L) => !L.cerrado));
    const ruta = [];

    while (true) {
        let mejor = null;

        const urgentesAlcanzables = [...pendientes].filter(
            (L) => esUrgente(L) && puedeLlegarA(pos, t, L, finJornada)
        );
        for (const local of pendientes) {
            const llegada = t + trasladoMin(pos, local);
            const inicio = inicioPosible(local.ventanas, llegada, local.tiempoVisitaMin);
            if (inicio === null) continue;

            if (inicio - llegada > esperaMaximaMin(local)) continue;

            const salida = inicio + local.tiempoVisitaMin;
            if (salida > finJornada) continue;

            const dejaUrgentesVivos = urgentesAlcanzables.every(
                (u) => u === local || puedeLlegarA(local, salida, u, finJornada)
            );
            if (!dejaUrgentesVivos) continue;

            const costo = salida - t;
            const score = valorVisita(local, diaActual) / costo;

            if (!mejor || score > mejor.score) {
                mejor = {local, score, llegada, inicio, salida };
            }
        }
        if (!mejor) break;

        ruta.push({
            id: mejor.local.id,
            llegada: hhmm(mejor.llegada),
            inicio: hhmm(mejor.inicio),
            salida: hhmm(mejor.salida),
        });
        t = mejor.salida;
        pos = mejor.local;
        pendientes.delete(mejor.local);
    }

    return {
        repositor: repo.nombre,
        ruta,
        sinVisitar: [...pendientes].map((L) => L.id),
    };
}

function dividirPorZona(locales, cantidad) {
    const ordenados = locales.slice().sort((a, b) => a.lon - b.lon);
    const tamano = Math.ceil(ordenados.length / cantidad);
    const grupos = [];
    for (let i = 0; i < cantidad; i++) {
        grupos.push(ordenados.slice(i * tamano, (i + 1) * tamano));
    }
    return grupos;
}

function planificarEquipo(repositores, locales, diaActual) {
    const grupos = dividirPorZona(locales, repositores.length);

    const planes = repositores.map((repo, i) =>
        planificarRepositor(repo, grupos[i], diaActual)
    );

    const visitadosHoy = new Set(planes.flatMap((p) => p.ruta.map((r) => r.id)));
    const urgentesSinVisitar = locales.filter(
        (L) => esUrgente(L) && !L.cerrado && !visitadosHoy.has(L.id)
    );
    if (urgentesSinVisitar.length > 0) {
        console.log(
            `\n⚠ Locales urgentes sin visitar: ${urgentesSinVisitar.map((L) => L.id).join(", ")}`
        );
    }

    const cerrados = locales.filter((L) => L.cerrado).map((L) => L.id);
    console.log(`Cerrados hoy: ${cerrados.join(", ")}`);

    const sinAsignar = planes.flatMap((p) => p.sinVisitar);
    return { planes, sinAsignar };
}

module.exports = { planificarRepositor, planificarEquipo };