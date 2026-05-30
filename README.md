# Discursapp

**Aplicación de escritorio open source para la coordinación y administración de discursos.**

## 🌐 ¿Qué es Discursapp?

DiscursApp es un proyecto para gestionar los roles de discursos entre congregaciónes. 
Integra lo siguiente:

- Informacion de oradores locales
- Lista de bosquejos
- Agenda de roles y acuerdos con congregaciónes
- Oradores visitantes
- Salidas a discursar
- Historial de eventos
- Notificaciones y recordatorios
- Generacion de programas y documentos en PDF

La version de escritorio esta pensada para poder trabajar offline sin necesidad de fuentes externas y con un acceso facil.

Está diseñada para ejecutarse como aplicación de escritorio en Windows mediante **Electron** y **Electron Forge**, con un backend local en **Node.js/Express** y un frontend basado en **HTML, CSS y JavaScript**.

## Descarga e instalacion del programa

**LA SIGUIENTE PARTE DE LA DOCUMENTACION ES PARA DESARROLLADORES O USUARIOS AVANZADOS**

## 🧩 Tecnologías principales

- **Electron**: plataforma que empaqueta la aplicación web como app de escritorio.
- **Electron Forge**: herramienta de configuración, construcción y empaquetado para Electron.
- **Node.js**: servidor backend local.
- **Express**: framework web para API REST.
- **SQLite**: base de datos local para datos offline.
- **AdminLTE / Bootstrap**: diseño e interfaz del frontend.
- **dotenv**: carga variables de entorno.
- **CORS** y **body-parser**: configuración de comunicación HTTP.

## 📂 Estructura del proyecto

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
├── forge.config.cjs
├── index.html
├── main.js
├── package.json
└── README.md
```

## 🚀 Requisitos para desarrollar y ejecutar

Para trabajar en el proyecto necesitas:

- **Windows 10/11** (o compatible con Electron). Solo se ha probado en x64.
- **Node.js** (recomendado: versión 18 o superior).
- **npm** (incluido con Node.js).
- **Git** para clonar el repositorio.
- **Visual Studio Code** o cualquier otro editor de código similar.

### Opcional, recomendado

- **Live Server** en VS Code para abrir `index.html` durante el desarrollo frontend.
- **GitHub Desktop** u otra GUI para Git.

## 🔧 Instalación del codigo de desarrollo paso a paso

1. Clona el repositorio:

```bash
git clone https://github.com/tu-usuario/discursapp.git
cd discursapp
```

2. Instala dependencias:

```bash
npm install
```

3. Ejecuta la aplicación en modo desarrollo con Electron Forge:

```bash
npm start
```

Este comando arranca la app de escritorio usando Electron. También puedes usar:

```bash
npm run dev
```

## 🧪 Scripts disponibles

El proyecto ya incluye scripts útiles en `package.json`:

- `npm start`: inicia la app con **Electron Forge**.
- `npm run dev`: ejecuta la app directamente con **Electron**.
- `npm run package`: empaqueta la aplicación en un directorio local.
- `npm run make`: genera instaladores para la plataforma configurada.

## 📝 Editar el código

### Backend

- Archivos principales: `backend/server.js`
- Configuración de la base de datos: `backend/config/db.js`
- Rutas y controladores: `backend/routes/` y `backend/controllers/`
- Middleware: `backend/middleware/errorHandler.js`

### Frontend

- Archivo de entrada principal: `index.html`
- Vistas de la interfaz: `src/pages/`
- Estilos: `src/css/`
- Scripts del frontend: `src/js/`
- Recursos estáticos: `src/assets/`

### Electron

- Punto de entrada de Electron: `main.js`
- Configuración de Forge: `forge.config.cjs`


## 📦 Empaquetado para Windows

Para generar una versión instalable en Windows:

```bash
npm run make
```

Esto creará un instalador en la carpeta de salida definida por Electron Forge.

## 🔍 Dependencias importantes

- `electron`
- `@electron-forge/cli`
- `@electron-forge/maker-squirrel`
- `@electron-forge/maker-zip`
- `@electron-forge/plugin-auto-unpack-natives`
- `@electron-forge/plugin-fuses`
- `express`
- `sqlite3`
- `cors`
- `body-parser`
- `dotenv`
- `mysql2`

## 📖 Documentación adicional

- `docs/DATABASE_SCHEMA.md`
- `docs/CHANGELOG.md`
- `docs/ACCESSIBILITY.md`

## 📢 Licencia

Este proyecto es **open source** bajo licencia **MIT**.

## 🤝 Autor

Desarrollado por **MarcoZ | MZTechonologies**.

## 🙌 Contribuciones

Si quieres ayudar a mejorar DiscursApp, abre un issue o envía un pull request con tus cambios. ¡Toda idea o ayuda es bienvenida!
