const db = require('../../db');

const findAll = async () => {
  const result = await db.query(
    `SELECT
       dh.id,
       dh.nombre,
       dh.es_laboratorio,
       COALESCE(
         JSONB_AGG(
           JSONB_BUILD_OBJECT(
             'id', d.id,
             'nombre', d.nombre,
             'relacion_id', dhd.id
           )
           ORDER BY d.id
         ) FILTER (WHERE d.id IS NOT NULL),
         '[]'::jsonb
       ) AS dias
     FROM dias_horario dh
     LEFT JOIN dias_horario_dia dhd ON dhd.dias_horario_id = dh.id
     LEFT JOIN dias d ON d.id = dhd.dia_id
     GROUP BY dh.id, dh.nombre, dh.es_laboratorio
     ORDER BY dh.id ASC`
  );

  return result.rows;
};

module.exports = {
  findAll,
};
