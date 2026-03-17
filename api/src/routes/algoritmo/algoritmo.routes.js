
const router = require('express').Router();
const { cargarContexto, generarPoblacion } = require('../../genetico');

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

module.exports = router;
