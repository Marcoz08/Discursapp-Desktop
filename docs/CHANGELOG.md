# Changelog

Todos los cambios notables de este proyecto (DiscursApp) se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Refactorización de DB:** Renombrado de la columna `id_registro` a `id_tituloOrador` en las tablas `temas_orador` y `salidas_discursar` para mejorar la claridad semántica en las relaciones orador-tema.
- **Interfaz:** Renombrada la página `registros.html` a `bosquejos.html` para mayor coherencia con el contenido del catálogo.

## [1.0.0] - 2026-04-22

### Added
- **Dashboard Principal:** Vista interactiva con estadísticas semanales de visitas, salidas y catálogos.
- **Gestión de Oradores:** Módulo para registrar, editar y eliminar oradores locales y asociarlos a congregaciones.
- **Catálogo de Bosquejos:** Registro de todos los temas presentados con control automático de fechas para evitar repeticiones recientes.
- **Programación de Visitas y Salidas:** Sistema para agendar oradores visitantes y registrar las salidas locales de manera mensual.
- **Conexión a Base de Datos en la Nube:** Integración sólida con MySQL hospedado en Railway a través de un backend en Node.js (Express).
- **Interfaz Moderna y Responsiva:** Diseño profesional utilizando Bootstrap 5, componentes de AdminLTE, iconos e indicadores visuales atractivos.
- **Seguridad y Variables de Entorno:** Configuración de archivo `.env` mediante `dotenv` para la protección de la cadena de conexión de la base de datos.
- **Arquitectura Limpia:** Reestructuración de archivos con separación clara entre el entorno de desarrollo (`src/`), recursos estáticos, y el código de producción.