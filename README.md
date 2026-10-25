# Ruteo de repositores

Planificador diario de visitas a puntos de venta (supermercados, despensas y farmacias) para un equipo de repositores. Dado un conjunto de locales con necesidades distintas y un equipo con jornada limitada, el programa decide qué locales visita cada repositor, en qué orden, y avisa cuando un caso urgente queda sin visitar.

## Requisitos

- Node.js 18 o superior.
- No requiere dependencias externas.

## Ejecutar

Desde la carpeta del proyecto:

```sh
node plan.js
```

El programa lee `datos.json` y muestra, para cada repositor, su ruta del día con hora de llegada, inicio y salida de cada visita. Al final informa:

- Los urgentes sin visitar, si los hay (`⚠ Locales urgentes sin visitar`).
- Los locales cerrados del día.
- Los locales sin asignar.

El día que se usa para calcular prioridades se configura en `plan.js`, en la constante `Dia_Actual`.

## Cómo entendí el problema

Cada día, un supervisor arma a mano la lista de visitas. El problema es decidir, con un equipo de repositores de jornada limitada, qué locales visitar, en qué orden, y qué hacer cuando un local urgente corre riesgo de quedar afuera.

Las restricciones que modelo son:

- **Urgencia:** un local con producto que vence en pocos días tiene prioridad.
- **Frecuencia comprometida:** cada local tiene una clase (A, B o C) que define cada cuántos días debe visitarse. Un local atrasado pesa más.
- **Ventanas horarias:** cada local atiende en ciertos tramos del día. Un supermercado no recibe visitas al mediodía.
- **Jornada limitada:** cada repositor tiene una hora de inicio y una duración. Los traslados y el tiempo dentro del local cuentan.
- **Varios repositores:** los locales se reparten entre el equipo.

## Decisiones principales

### 1. Reparto por zona, no por lista

Los locales se ordenan por longitud (de oeste a este) y se cortan en franjas. Cada repositor recibe una franja y planifica solo sus locales. La función `dividirPorZona` hace este corte.

Descarté el reparto secuencial, donde el primer repositor elegía de toda la lista y el último quedaba sin locales. Con franjas, la cantidad de locales por repositor es pareja desde el principio.

**Límite:** una franja puede tener locales alejados del depósito, y un local que el repositor de su franja no alcanza no se pasa a otro repositor con tiempo libre. Esos locales aparecen en "Sin asignar".

### 2. Jornadas distintas

Ana y Bruno tienen una jornada de 10 horas (`jornadaMin: 600`, de 07:00 a 17:00). Diego tiene una jornada de 8 horas (`jornadaMin: 480`, de 07:00 a 15:00).

Esta diferencia es intencional, para observar cómo afecta el resultado. Como el reparto se hace por cantidad de locales, Diego recibe la misma cantidad de locales que los otros con menos tiempo disponible. Eso se ve en la salida: sus franjas tienden a quedar con más locales sin asignar.

Una mejora sería dividir las franjas en proporción a la jornada de cada repositor, no solo por cantidad.

### 3. Criterio de orden: valor sobre costo (greedy)

En cada paso, el repositor elige el local que maximiza:

```
score = valor / costo
```

- **Valor** (`prioridad.js`): `3 × urgencia + 1 × atraso + 1.5 × peso de clase`.
  - `urgencia = 10 − diasParaVencer`, si el producto tiene vencimiento (cuanto más cerca, más urgencia). Si no tiene vencimiento próximo, vale 0.
    La regla dura de urgencia (esperas, reserva y alerta) usa `Dias_Urgente = 3`. El valor, en cambio, pondera gradualmente cualquier vencimiento cercano.
  - `atraso` son los días de visita comprometida que se deben.
  - Peso de clase (`Peso_Clase`): A = 3, B = 2, C = 1.
- **Costo** (`planificador.js`): minutos desde que el repositor está libre hasta que termina la visita. Incluye traslado, espera y duración de la visita.

Los pesos (3, 1 y 1.5) son decisiones de diseño. La urgencia pesa más porque perder un producto vencido es el costo más concreto para la empresa.

Elegí greedy y no un óptimo porque el recorrido óptimo es un problema caro y no es lo que se evalúa. Una regla simple y explicable es preferible a un resultado sofisticado que no se puede defender.

### 4. Reserva para urgentes

Antes de elegir un local, el algoritmo verifica que esa elección no deje inalcanzable a ningún urgente que todavía se podía visitar. Si la deja, el candidato se descarta en ese paso (`dejaUrgentesVivos`).

Es una protección de un paso, no una planificación completa de la jornada.

### 5. Espera según urgencia

Un repositor no espera frente a cualquier local:

- **Urgente** (`Dias_Urgente = 3`): hasta 240 minutos de espera. Perder el producto tiene un costo directo, y un supermercado que abre a las 14:00 debe poder entrar en el plan aunque el repositor llegue a las 10:40.
- **Rutina:** hasta 30 minutos de espera. Esperar en un local de rutina reduce las visitas del día sin una razón urgente.

Estos valores son supuestos de negocio a validar con operaciones.

### 6. Distancia y velocidad

Las distancias se calculan en línea recta con la fórmula de Haversine (radio de la Tierra de 6371 km). Los traslados se estiman dividiendo esa distancia por una velocidad promedio de 40 km/h (`velocidad_KMH`).

La velocidad de 40 km/h ya absorbe tráfico, paradas y la sinuosidad de las calles, por eso no se aplica un factor de corrección adicional. Es un supuesto que hay que validar con datos reales.

### 7. Datos

Todos los datos de `datos.json` son ficticios. Las coordenadas se ubican alrededor de Asunción; los tiempos de visita, ventanas, frecuencias y vencimientos se inventaron para probar casos concretos: urgentes de mañana y de tarde, locales cerrados, locales con ventana solo a la tarde y locales atrasados.

## Archivos

- `plan.js`: punto de entrada. Carga los datos, ejecuta el plan e imprime el resultado.
- `planificador.js`: reparto por zona y construcción de la ruta de cada repositor.
- `prioridad.js`: cálculo del valor de visitar un local.
- `ventanas.js`: busca el primer instante en que puede empezar una visita dentro de las ventanas horarias.
- `tiempo_distancia.js`: distancia, traslados y formato de horas.
- `datos.json`: repositores y locales de prueba.

## Formato de `datos.json`

- `repositores`: cada uno tiene `nombre`, `inicio` (`lat`, `lon`), `horaInicio` y `jornadaMin`.
- `locales`: cada uno tiene `id`, `nombre`, `lat`, `lon`, `clase` (`A`, `B` o `C`), `frecuenciaDias`, `ultimaVisitaDia`, `tiempoVisitaMin`, `ventanas`, `diasParaVencer` y `cerrado`.

Los horarios se expresan en minutos desde medianoche: `420` son las 07:00 y `840` son las 14:00. Cada ventana es un par `[inicio, fin]`. `diasParaVencer` puede ser `null`. Los locales con `cerrado: true` no se planifican.

## Qué anda mal o quedaría feo a escala

- **Reparto por longitud:** no considera la distancia real entre locales ni la posición de cada repositor. Dos locales cercanos pueden quedar en franjas distintas.
- **Reparto por cantidad, no por jornada:** con jornadas distintas, la carga no es proporcional al tiempo disponible.
- **Reserva de un paso:** la protección de urgentes no planifica la jornada completa. Si varios urgentes compiten por el mismo horario, puede que alguno quede afuera; por eso existe la alerta.
- **Sobrantes sin redistribuir:** un local que el repositor de su franja no alcanza no se pasa a otro repositor con tiempo libre.
- **Costo computacional:** en cada vuelta se recalculan las alcanzabilidades de los urgentes para cada candidato. Con cientos de locales, esto crece rápido.
- **Sin replanificación:** no se puede actualizar el plan durante el día cuando un local cierra, un traslado tarda más o entra un pedido urgente.
- **Sin validación de datos:** un error en `datos.json` (un horario mal escrito, una clase inexistente) no se detecta con un mensaje claro.
- **Jornada corrida:** el enunciado habla de 8 horas. Ana y Bruno trabajan 10 horas para cubrir las ventanas de tarde. Una jornada partida (mañana y tarde con corte al mediodía) sería más realista, pero requiere cambiar la lógica de tiempos.

## Qué haría con dos semanas más

1. **Reservar horario a los urgentes** antes de armar el resto de la ruta, en lugar de protegerlos paso a paso.
2. **Jornada partida**, modelando el corte de mediodía como parte de la disponibilidad del repositor.
3. **Replanificación en vivo:** recalcular el resto de la jornada desde la hora y posición actuales cuando cambia un dato (cierre, demora, pedido urgente).
4. **Dividir por jornada:** repartir las franjas en proporción al tiempo disponible de cada repositor.
5. **Redistribuir sobrantes** entre repositores que tengan tiempo libre.
6. **Matriz de distancias real**, con tiempos de traslado según calles y horas pico, en lugar de Haversine.
7. **Validación de `datos.json`** con mensajes claros antes de planificar.
8. **Calibrar los supuestos** (velocidad, esperas, pesos, umbral de urgencia) con datos reales de la operación.
