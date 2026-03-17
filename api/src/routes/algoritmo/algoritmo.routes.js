
const router = require('express').Router();
const { cargarContexto, generarPoblacion, generarIndividuo, evaluarAptitud,
  seleccionarPadres, evaluarPoblacion, cruzar, mutar, ejecutarAG, guardarHorario
} = require('../../genetico');

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


router.get('/test-seleccion', async (req, res) => {
  const ctx      = await cargarContexto();
  const poblacion = generarPoblacion(ctx);
  evaluarPoblacion(poblacion, ctx);

  const [padreA_t, padreB_t] = seleccionarPadres(poblacion, 'torneo');
  const [padreA_r, padreB_r] = seleccionarPadres(poblacion, 'ruleta');

  res.json({
    mejor_poblacion:    poblacion[0].aptitud,
    peor_poblacion:     poblacion[poblacion.length - 1].aptitud,
    torneo: {
      padreA: padreA_t.aptitud,
      padreB: padreB_t.aptitud,
      son_distintos: padreA_t !== padreB_t,
    },
    ruleta: {
      padreA: padreA_r.aptitud,
      padreB: padreB_r.aptitud,
      son_distintos: padreA_r !== padreB_r,
    },
  });
});

router.get('/test-cruce', async (req, res) => {
  const ctx      = await cargarContexto();
  const poblacion = generarPoblacion(ctx);
  evaluarPoblacion(poblacion, ctx);

  const [padreA, padreB] = seleccionarPadres(poblacion, 'torneo');
  const [hijo1_up, hijo2_up]  = cruzar(padreA, padreB, 'un_punto');
  const [hijo1_mp, hijo2_mp]  = cruzar(padreA, padreB, 'multipunto');

  evaluarAptitud(hijo1_up, ctx);
  evaluarAptitud(hijo2_up, ctx);
  evaluarAptitud(hijo1_mp, ctx);
  evaluarAptitud(hijo2_mp, ctx);

  res.json({
    padres: {
      padreA: padreA.aptitud,
      padreB: padreB.aptitud,
    },
    un_punto: {
      hijo1: hijo1_up.aptitud,
      hijo2: hijo2_up.aptitud,
      genes_intactos: hijo1_up.genes.every(g => g.seccion_id !== undefined),
    },
    multipunto: {
      hijo1: hijo1_mp.aptitud,
      hijo2: hijo2_mp.aptitud,
      genes_intactos: hijo1_mp.genes.every(g => g.seccion_id !== undefined),
    },
  });
});


router.get('/test-mutacion', async (req, res) => {
  const ctx       = await cargarContexto();
  const poblacion = generarPoblacion(ctx);
  evaluarPoblacion(poblacion, ctx);

  const [padreA, padreB] = seleccionarPadres(poblacion, 'torneo');
  const [hijo1, hijo2]   = cruzar(padreA, padreB, 'un_punto');

  // Clonar antes de mutar para comparar antes/después
  const antes1 = hijo1.aptitud;
  const antes2 = hijo2.aptitud;

  // Tasa alta (0.8) para forzar mutaciones en el test
  const mutado1_i = mutar({ ...hijo1, genes: hijo1.genes.map(g => ({...g})) },
                           'intercambio', 0.8);
  const mutado2_r = mutar({ ...hijo2, genes: hijo2.genes.map(g => ({...g})) },
                           'reisercion',  0.8, ctx);

  evaluarAptitud(mutado1_i, ctx);
  evaluarAptitud(mutado2_r, ctx);

  res.json({
    intercambio: {
      antes:  antes1,
      despues: mutado1_i.aptitud,
      cambio:  mutado1_i.aptitud - (antes1 ?? 0),
    },
    reisercion: {
      antes:  antes2,
      despues: mutado2_r.aptitud,
      cambio:  mutado2_r.aptitud - (antes2 ?? 0),
    },
  });
});

router.get('/test-algoritmo', async (req, res) => {
  const ctx = await cargarContexto();

  const { mejorIndividuo, historial, stats } = await ejecutarAG(ctx);

  res.json({
    stats,
    mejor_aptitud:      mejorIndividuo.aptitud,
    primera_generacion: historial[0],
    ultima_generacion:  historial[historial.length - 1],
    mejoro:             historial[historial.length - 1].mejorAptitud >
                        historial[0].mejorAptitud,
  });
});

module.exports = router;
