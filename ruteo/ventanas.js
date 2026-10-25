function inicioPosible(ventanas, t, duracion) {
    for (const [ini, fin] of ventanas) {
        const inicio = Math.max(t, ini);
        if (inicio + duracion <= fin) return inicio;
    }
    return null;
}

module.exports = { inicioPosible };