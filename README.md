# DiscursApp 🎤

**Aplicación de escritorio para la administración y coordinación de discursos públicos.**

## 📌 Resumen

DiscursApp es una herramienta pensada para administrar la programación de oradores, visitantes, bosquejos, agenda y salidas de una congregación. En su estado actual, la aplicación funciona como una solución local con **backend en Node.js/Express** y **frontend en HTML, CSS y JavaScript**, lista para encapsularse en una versión de escritorio con **Electron**.

La lógica actual ya está preparada para ejecutarse de forma local y offline, con una base de datos **SQLite** dentro del proyecto, lo que la hace ideal para uso en escritorio sin depender de servicios externos.

## ✨ Qué hace la aplicación

- **Dashboard** con información general del sistema.
- **Gestión de oradores** y sus temas.
- **Registro de bosquejos** y seguimiento de presentaciones.
- **Agenda y programación** de discursos.
- **Control de visitantes** y salidas.
- **Histórico** de registros y actividades.
- **Notificaciones** y panel de gestión.

## 🧱 Estado actual del proyecto

### Frontend

- Interfaz construida con **HTML5**, **CSS**, **JavaScript** y componentes basados en **AdminLTE / Bootstrap**.
- Las vistas se encuentran en `src/pages/`.
- La entrada principal es `index.html`, que redirige al `home.html`.

### Backend

- Servidor creado con **Node.js + Express**.
- API REST expuesta bajo `/api`.
- Manejo de CORS y JSON mediante `body-parser`.
- Validación y manejo de errores centralizados en `backend/middleware/errorHandler.js`.

### Base de datos

- Actualmente se utiliza **SQLite** local.
- La conexión está configurada en `backend/config/db.js`.
- La base de datos se guarda en `backend/data/discursapp_sqlite.db`.

> En esta versión, la app está orientada a ejecución local y escritorio, no a una arquitectura de nube.

## 🖥️ Versión de escritorio con Electron

El proyecto está preparado para evolucionar hacia una aplicación de escritorio con **Electron**, manteniendo:

- El mismo **frontend** que ya se utiliza en el navegador.
- El **backend local** para manejar la API y la base de datos.
- Un empaquetado gráfico para que el usuario abra la app como una ventana nativa.

Actualmente, el contenido del README describe la **base funcional actual** del proyecto, y la integración con Electron debe añadirse como una capa de empaquetado o lanzamiento.

## 📁 Estructura del proyecto

```text
discursapp/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── data/
│   ├── middleware/
│   ├── routes/
│   └── server.js
├── docs/
├── src/
│   ├── assets/
│   ├── css/
│   ├── js/
│   └── pages/
├── index.html
├── package.json
└── README.md
```

## 🔧 Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/discursapp.git
cd discursapp
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Iniciar el backend

```bash
npm start
```

Esto levanta el servidor local en:

```text
http://localhost:3000
```

### 4. Abrir la interfaz

Puedes abrir la app de dos maneras:

#### Opción A: navegador

Abre `index.html` o usa una extensión como **Live Server**.

#### Opción B: escritorio (futuro / integración con Electron)

El proyecto está listo para adaptarse a Electron como contenedor de esa misma interfaz y backend local.

## 🧪 Dependencias principales

- **Node.js**
- **Express.js**
- **SQLite3**
- **dotenv**
- **cors**
- **body-parser**
- **mysql2** (soporte de compatibilidad para uso de datos relacionales)

## 📦 Scripts disponibles

```json
"scripts": {
  "start": "node backend/server.js"
}
```

## 📚 Documentación adicional

- `docs/DATABASE_SCHEMA.md`
- `docs/CHANGELOG.md`
- `docs/ACCESSIBILITY.md`

## 👤 Autor

Desarrollado por **MarcoZ | MZTechonologies**.

## 📝 Nota importante

Si quieres que el README describa **ya una versión empaquetada en Electron**, será necesario añadir primero la capa de Electron al proyecto (dependencias, script principal y empaquetado). Esta guía refleja el **estado real actual** del proyecto.
