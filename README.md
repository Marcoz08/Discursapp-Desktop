<h1 align="center">DiscursApp 🎤</h1>

<p align="center">
  <strong>Aplicación web para la gestión y coordinación de discursos públicos.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="NodeJS">
  <img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white" alt="ExpressJS">
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/Bootstrap_5-7952B3?style=flat-square&logo=bootstrap&logoColor=white" alt="Bootstrap">
</p>

---

## 📖 Acerca del Proyecto

**DiscursApp** es una herramienta administrativa integral diseñada para facilitar la coordinación de oradores y discursos públicos. Proporciona una interfaz limpia y fácil de usar (basada en AdminLTE y Bootstrap 5) para mantener el control sobre los oradores locales, visitantes, bosquejos presentados y la programación mensual de la congregación.

Este proyecto fue desarrollado poniendo en práctica los estándares modernos de arquitectura Cliente-Servidor, separando la lógica de desarrollo frontend del servidor y base de datos relacional.

## ✨ Características Principales

- **Dashboard Interactivo:** Vista rápida de la programación semanal, visitantes esperados y estadísticas de la base de datos local.
- **Gestión de Oradores:** Registro de oradores locales y sus temas asignados.
- **Catálogo de Bosquejos:** Historial de discursos presentados con fechas de última presentación para evitar repeticiones a corto plazo.
- **Agenda y Programación:** Módulo para agendar discursos, registrar salidas a otras congregaciones y visitas locales.
- **Base de Datos en la Nube:** Conexión segura a una base de datos MySQL desplegada en Railway.

## 🛠️ Tecnologías Utilizadas

### Frontend

- **HTML5 & CSS3**
- **JavaScript (Vanilla JS)** para consumo de API y manipulación del DOM.
- **AdminLTE v4** & **Bootstrap 5** para una interfaz responsiva y profesional.
- **Librerías Extra:** ApexCharts, OverlayScrollbars.

### Backend

- **Node.js** con **Express.js** como framework para crear una API RESTful.
- **CORS** & **Body-Parser** para el manejo de peticiones HTTP.
- **Dotenv** para la protección de variables de entorno y credenciales.

### Base de Datos

- **MySQL** gestionada en la nube mediante **Railway**.
- Consultas manejadas asíncronamente con `mysql2/promise`.

## 📁 Estructura del Proyecto

```text
discursapp/
├── backend/                # Lógica del servidor (API REST)
│   └── server.js           # Archivo principal de entrada a la API
├── src/                    # Código fuente de desarrollo (Frontend)
│   ├── assets/             # Imágenes y favicons
│   ├── css/                # Archivos de estilos base
│   ├── js/                 # Scripts globales
│   └── pages/              # Vistas HTML (Dashboard, Agenda, etc.)
├── .env.example            # Archivo de ejemplo para variables de entorno
├── .gitignore              # Archivos excluidos de git (ej. node_modules, .env)
├── package.json            # Dependencias del proyecto
└── index.html              # Redireccionador de entrada
```

## 🚀 Instalación y Ejecución Local

Si deseas clonar y probar el proyecto en tu entorno local, sigue estos pasos:

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/discursapp.git
cd discursapp
```

### 2. Instalar las dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo llamado `.env` en la raíz del proyecto y agrega tu cadena de conexión a la base de datos MySQL:

```env
DATABASE_URL="mysql://usuario:contraseña@host:puerto/nombre_bd"
```

### 4. Iniciar el Servidor Backend

```bash
npm start
```

_El servidor correrá en `http://localhost:3000`._

### 5. Iniciar el Frontend

Para ver la interfaz, simplemente abre el archivo `index.html` de la raíz en tu navegador, o utiliza una extensión como **Live Server** en VS Code.

## 🤝 Autor

Desarrollado por **MarcoZ | MZTechonologies**.
