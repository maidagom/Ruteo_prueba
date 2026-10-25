const datos = require("./datos.json");
const { planificarEquipo } = require("./planificador");

const Dia_Actual = 20;

const resultado = planificarEquipo(datos.repositores, datos.locales, Dia_Actual);

for (const plan of resultado.planes) {
    console.log(`\n== ${plan.repositor} (${plan.ruta.length} visitas) ==`);
    for (const paso of plan.ruta) {
        console.log(` ${paso.llegada} llega · ${paso.inicio}-${paso.salida} ${paso.id}`);
    }
}

console.log(`\nSin asignar: ${resultado.sinAsignar.length} locales`);