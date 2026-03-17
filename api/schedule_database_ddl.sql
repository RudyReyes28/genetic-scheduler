-- ============================================================
-- PROYECTO ALGORITMO GENÉTICO DE HORARIOS
-- USAC CUNOC — División de Ciencias de la Ingeniería
-- ============================================================

-- Catálogos base

CREATE TABLE carreras (
  id     SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE dias_horario (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(50) NOT NULL,
  es_laboratorio BOOLEAN     DEFAULT FALSE
);

CREATE TABLE dias (
  id     SERIAL PRIMARY KEY,
  nombre VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE dias_horario_dia (
  id             SERIAL PRIMARY KEY,
  dias_horario_id INT REFERENCES dias_horario(id),
  dia_id          INT REFERENCES dias(id),
  UNIQUE(dias_horario_id, dia_id)
);

INSERT INTO dias_horario (nombre, es_laboratorio) VALUES
  ('Lunes, Miércoles y Viernes', false),
  ('Martes y Jueves',            true);

INSERT INTO dias (nombre) VALUES
  ('lunes'), ('martes'), ('miercoles'), ('jueves'), ('viernes');

-- Lunes, Miércoles y Viernes (id=1) -> lunes(1), miercoles(3), viernes(5)
INSERT INTO dias_horario_dia (dias_horario_id, dia_id) VALUES
  (1, 1), (1, 3), (1, 5);

-- Martes y Jueves (id=2) -> martes(2), jueves(4)
INSERT INTO dias_horario_dia (dias_horario_id, dia_id) VALUES
  (2, 2), (2, 4);

CREATE TABLE periodos (
  id          SERIAL PRIMARY KEY,
  numero      INT     NOT NULL,
  hora_inicio TIME    NOT NULL,
  hora_fin    TIME    NOT NULL,
  es_manana   BOOLEAN,
  es_tarde    BOOLEAN
);

-- Salones y Docentes

CREATE TABLE salones (
  id                     SERIAL PRIMARY KEY,
  nombre                 VARCHAR(100) NOT NULL,
  capacidad              INT,
  es_laboratorio         BOOLEAN DEFAULT FALSE,
  lab_habilitado_teorico BOOLEAN DEFAULT FALSE,
  disponible_manana      BOOLEAN DEFAULT TRUE,
  disponible_tarde       BOOLEAN DEFAULT TRUE,
  activo                 BOOLEAN DEFAULT TRUE
);

CREATE TABLE docentes (
  id                SERIAL PRIMARY KEY,
  nombre            VARCHAR(150) NOT NULL,
  registro_personal VARCHAR(20) UNIQUE NOT NULL,
  hora_entrada      TIME NOT NULL,
  hora_salida       TIME NOT NULL,
  activo            BOOLEAN DEFAULT TRUE
);

-- Cursos y Laboratorios

CREATE TABLE cursos (
  id                SERIAL PRIMARY KEY,
  nombre            VARCHAR(150) NOT NULL,
  codigo            VARCHAR(20)  NOT NULL,
  carrera_id        INT REFERENCES carreras(id),
  semestre          INT NOT NULL,
  tipo              VARCHAR(15) NOT NULL CHECK (tipo IN ('obligatorio','optativo')),
  num_estudiantes   INT,
  puede_manana      BOOLEAN DEFAULT TRUE,
  puede_tarde       BOOLEAN DEFAULT TRUE,
  tiene_laboratorio BOOLEAN DEFAULT FALSE,
  activo            BOOLEAN DEFAULT TRUE
);

CREATE TABLE laboratorios (
  id           SERIAL PRIMARY KEY,
  curso_id     INT UNIQUE REFERENCES cursos(id),
  nombre       VARCHAR(150),
  num_periodos INT     DEFAULT 3,
  puede_manana BOOLEAN DEFAULT TRUE,
  puede_tarde  BOOLEAN DEFAULT TRUE,
  activo       BOOLEAN DEFAULT TRUE
);

CREATE TABLE secciones (
  id                      SERIAL PRIMARY KEY,
  curso_id                INT REFERENCES cursos(id),
  letra                   VARCHAR(5) NOT NULL,
  num_estudiantes_seccion INT,
  salon_fijo_id           INT REFERENCES salones(id),
  docente_fijo_id         INT REFERENCES docentes(id),
  periodo_fijo_inicio_id  INT REFERENCES periodos(id),
  dia_horario_fijo_id     INT REFERENCES dias_horario(id),
  sin_salon               BOOLEAN DEFAULT FALSE,
  UNIQUE(curso_id, letra)
);

CREATE TABLE seccion_laboratorio (
  id              SERIAL PRIMARY KEY,
  seccion_id      INT UNIQUE REFERENCES secciones(id),
  laboratorio_id  INT REFERENCES laboratorios(id),
  salon_fijo_id   INT REFERENCES salones(id),
  docente_fijo_id INT REFERENCES docentes(id)
);

-- Relación Docente - Curso

CREATE TABLE docente_curso (
  id                SERIAL PRIMARY KEY,
  docente_id        INT REFERENCES docentes(id),
  curso_id          INT REFERENCES cursos(id),
  puede_laboratorio BOOLEAN DEFAULT FALSE,
  UNIQUE(docente_id, curso_id)
);

-- Horario generado

CREATE TABLE horarios (
  id                      SERIAL PRIMARY KEY,
  nombre                  VARCHAR(100),
  fecha_generacion        TIMESTAMP DEFAULT NOW(),
  aptitud_final           FLOAT,
  generaciones_ejecutadas INT,
  tiempo_ejecucion_ms     INT,
  metodo_seleccion        VARCHAR(50),
  metodo_cruce            VARCHAR(50),
  metodo_mutacion         VARCHAR(50),
  es_activo               BOOLEAN DEFAULT FALSE
);

CREATE TABLE horario_detalle (
  id                SERIAL PRIMARY KEY,
  horario_id        INT REFERENCES horarios(id) ON DELETE CASCADE,
  seccion_id        INT REFERENCES secciones(id),
  seccion_lab_id    INT REFERENCES seccion_laboratorio(id),
  salon_id          INT REFERENCES salones(id),
  docente_id        INT REFERENCES docentes(id),
  dia_horario_id    INT REFERENCES dias_horario(id),
  periodo_inicio_id INT REFERENCES periodos(id),
  periodo_fin_id    INT REFERENCES periodos(id),
  modificado_manual BOOLEAN DEFAULT FALSE,
  CONSTRAINT chk_seccion CHECK (
    (seccion_id IS NOT NULL AND seccion_lab_id IS NULL) OR
    (seccion_id IS NULL     AND seccion_lab_id IS NOT NULL)
  )
);

-- Configuración del algoritmo

CREATE TABLE configuracion_algoritmo (
  id                 SERIAL PRIMARY KEY,
  tamano_poblacion   INT     DEFAULT 100,
  max_generaciones   INT     DEFAULT 500,
  aptitud_objetivo   FLOAT,
  tasa_mutacion      FLOAT   DEFAULT 0.05,
  metodo_seleccion   VARCHAR(50) DEFAULT 'torneo',
  metodo_cruce       VARCHAR(50) DEFAULT 'un_punto',
  metodo_mutacion    VARCHAR(50) DEFAULT 'intercambio',
  duracion_periodo   INT     DEFAULT 50,
  hora_inicio_manana TIME    DEFAULT '08:00',
  hora_fin_manana    TIME    DEFAULT '13:00',
  hora_inicio_tarde  TIME    DEFAULT '13:40',
  hora_fin_tarde     TIME    DEFAULT '21:10'
);



ALTER TABLE cursos
ADD CONSTRAINT uq_cursos_codigo UNIQUE (codigo);


CREATE TABLE horario_historial (
  id            SERIAL PRIMARY KEY,
  horario_id    INT REFERENCES horarios(id) ON DELETE CASCADE,
  generacion    INT     NOT NULL,
  mejor_aptitud FLOAT   NOT NULL,
  conflictos    INT     NOT NULL
);
 CREATE INDEX idx_historial_horario ON horario_historial(horario_id);