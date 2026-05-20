# Estructura de la Base de Datos - DiscursApp

Este documento detalla la arquitectura de la base de datos SQLite utilizada en el proyecto. La base de datos se encuentra en `backend/data/discursapp_sqlite.db`.

##  Diagrama Lógico (Resumen)

- **Oradores** <1---N> **Temas_Orador**
- **Lista_Bosquejos** <1---N> **Temas_Orador**
- **Agenda** <1---N> **Agenda_Meses** <N---1> **Meses**
- **Salidas_Discursar** <N---1> **Temas_Orador**
- **Salidas_Discursar** <N---1> **Agenda**
- **Salidas_Discursar** <N---1> **Oradores**

---

##  Detalle de Tablas

### 1. `lista_bosquejos`
Almacena el catálogo oficial de discursos públicos y su historial de presentación.
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id_bosquejo` | INT (PK AI) | Identificador técnico único. |
| `num` | INT | Número oficial del bosquejo (Opcional). |
| `titulo` | VARCHAR(255) | Título completo del discurso. |
| `fecha_ult` | DATE | Fecha de la última vez que se presentó en la congregación local. |
| `fecha_ant` | DATE | Registro histórico de la penúltima presentación. |
| `s34` | BOOLEAN | Indica si el bosquejo pertenece al catálogo regular S-34 (1) o es especial (0). Default: 1. |
| `clave` | VARCHAR(10) | Clave identificadora o abreviatura del bosquejo. Default: ''. |

### 2. `oradores`
Registro de oradores locales y sus datos de contacto.
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id_orador` | INT (PK AI) | Identificador único del orador. |
| `nombre` | VARCHAR(100) | Nombre completo (Not Null). |
| `telefono` | VARCHAR(20) | Número de contacto. |
| `privilegio` | BOOLEAN | `1` para Ancianos, `0` para Siervos Ministeriales. |
| `congregacion`| VARCHAR(100) | Congregación a la que pertenece (Default: 'El Castillo'). |
| `aprobado` | BOOLEAN | Indica si está autorizado para salir a discursar. |

### 3. `temas_orador`
Relaciona a los oradores con los discursos que tienen preparados.
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id_tituloOrador` | INT (PK AI) | ID único del registro. |
| `id_orador` | INT (FK) | Referencia a `oradores.id_orador`. |
| `id_bosquejo` | INT (FK) | Referencia a `lista_bosquejos.id_bosquejo`. |
| `titulo` | VARCHAR(255) | Título del tema (puede ser personalizado). |
| `cancion_sugerida`| INT | Número de canción asociada al tema. |

### 4. `agenda`
Gestiona los acuerdos y asignaciones de salidas o eventos especiales.
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id_rol` | BIGINT (PK AI)| Identificador único del evento. |
| `fecha_ini` | DATE | Fecha de inicio del periodo. |
| `fecha_fin` | DATE | Fecha de finalización del periodo. |
| `congregacion`| VARCHAR(255) | Congregación destino o asociada. |
| `estatus` | BOOLEAN | `1` Confirmado, `0` Pendiente. |
| `notas` | TEXT | Observaciones adicionales. |
| `hora_reunion`| TIME | Hora programada de la reunión. |
| `dia_rp` | INT | Día de la semana (6=Sáb, 7=Dom). |
| `direccion` | VARCHAR(255) | Ubicación física de la congregación. |

### 5. `meses`
Tabla maestra de referencia para los meses del año.
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id_mes` | INT (PK) | ID del mes (1-12). |
| `mes` | VARCHAR | Nombre del mes (Enero, Febrero...). |

### 6. `agenda_meses`
Tabla puente (Many-to-Many) entre la agenda y los meses.
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id_rol` | BIGINT (FK) | Referencia a `agenda.id_rol`. |
| `id_mes` | INT (FK) | Referencia a `meses.id_mes`. |
*Clave Primaria Compuesta por (id_rol, id_mes).*

### 7. `reuniones`
Configuración estática de la reunión de fin de semana local.
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id_reunion` | INT (PK) | Identificador único. |
| `dia_rp` | INT | Día de la semana local (1-7). |
| `hora_reunion`| TIME | Hora de inicio local. |
| `congregacion`| VARCHAR | Nombre de la congregación local. |

### 8. `oradores_visitantes`
Programación mensual de oradores que visitan la congregación.
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id_visitante` | INT (PK AI) | ID del registro de visita. |
| `nombre` | VARCHAR | Nombre del orador visitante. |
| `num_bosquejo`| INT | Número de tema que presentará. |
| `tema` | VARCHAR | Título del discurso. |
| `cancion` | INT | Canción de apertura. |
| `fecha_discurso`| DATE | Fecha exacta de la visita. |
| `congregacion`| VARCHAR | Congregación de origen del visitante. |
| `asistio` | BOOLEAN | Confirmación de asistencia realizada. |

### 9. `salidas_discursar`
Almacena el orador y los datos necesarios para su salida a discursar.
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id_salida` | INT (PK AI) | Identificador único de la salida. |
| `id_tituloOrador` | INT (FK) | Referencia a `temas_orador.id_tituloOrador`. Vincula al orador con el tema seleccionado. |
| `id_rol` | INT (FK) | Referencia a `agenda.id_rol`. Asocia la salida a un acuerdo específico de la agenda. |
| `fecha_salida` | DATE | Fecha programada para la salida a discursar. |
| `id_orador` | INT (FK) | Referencia a `oradores.id_orador`. |

### 10. `reuniones_especiales`
Almacena información sobre eventos fuera de la programación ordinaria (Asambleas, visitas de superintendente, etc).
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id_ReuEsp` | INTEGER (PK AI) | Identificador único del evento. |
| `fecha` | DATE | Fecha en la que ocurrirá el evento. |
| `hora_reunion` | TEXT | Hora de inicio programada. |
| `tipo_reunion` | VARCHAR(255) | Tipo o nombre de la reunión especial. |

### 11. `historico`
Almacena un registro sobre eventos fuera de los roles o eventos pasados (Salidas a discursar de ultimo momento, invitaciones personales a discursar, etc).
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id_historico` | INTEGER (PK AI) | Identificador único del registro. |
| `fecha` | DATE | Fecha en la que ocurrirá el evento. |
| `nombre` | TEXT | Nombre del orador. |
| `titulo` | TEXT | Titulo del bosquejo.|
| `congregacion` | TEXT | Hora de inicio programada. |
| `tipo_registro` | INTEGER | `1` para visita, `0` para salida.  |