
const router = require('express').Router();
const { cargarContexto, generarPoblacion, generarIndividuo, evaluarAptitud } = require('../../genetico');

router.get('/test-cromosoma', async (req, res) => {
  const ctx        = await cargarContexto();
  const poblacion  = generarPoblacion(ctx);
  const individuo  = poblacion[0];

  res.json({
    total_genes:     individuo.genes.length,
    genes_cursos:    individuo.genes.filter(g => g.seccion_id).length,
    genes_labs:      individuo.genes.filter(g => g.seccion_lab_id).length,
    muestra:         individuo.genes.slice(0, 6),
  });
});


router.get('/test-aptitud', async (req, res) => {
  const ctx       = await cargarContexto();
  const individuo = generarIndividuo(ctx);
  const resultado = evaluarAptitud(individuo, ctx, true); // true = con detalle

  res.json({
    aptitud:  resultado.aptitud,
    conflictos: resultado.detalle.filter(d => d.penalizacion),
    bonos:      resultado.detalle.filter(d => d.bono),
  });
});

module.exports = router;
