# Accesibilidad en DiscursApp

En **DiscursApp**, estamos comprometidos con proporcionar una experiencia de usuario inclusiva y accesible para todos los miembros de la congregación, incluyendo a las personas con discapacidades que utilizan tecnologías de asistencia (como lectores de pantalla o navegación por teclado). 

Dado que nuestra aplicación se basa en el framework **Bootstrap 5** y utiliza el motor de **AdminLTE**, hemos heredado y adaptado muchas de las mejores prácticas de accesibilidad web que apuntan al cumplimiento de las normativas **WCAG 2.1 AA**.

---

## 🎯 Características de Accesibilidad (Cumplimiento WCAG 2.1 AA)

### **Principio 1: Perceptible**

- **Alternativas de Texto:** Todas las imágenes y logotipos importantes tienen atributos `alt` descriptivos para que los lectores de pantalla puedan interpretarlos.
- **Iconografía Inclusiva:** Los iconos puramente decorativos (como los *Bootstrap Icons* utilizados en el menú lateral) usan el atributo `aria-hidden="true"` para evitar ruido visual y auditivo innecesario.
- **Jerarquía y Estructura:** El HTML está estructurado usando etiquetas semánticas estrictas (`<main>`, `<nav>`, `<aside>`, `<footer>`) y mantiene un orden lógico de encabezados (`<h1>`, `<h2>`, `<h3>`), lo que permite entender la página sin necesidad de estilos visuales.
- **Contraste de Color:** La paleta de colores asegura un contraste mínimo de 4.5:1 para el texto, garantizando una excelente legibilidad bajo distintas condiciones de iluminación.
- **Diseño Responsivo:** Las vistas pueden ampliarse hasta un 200% sin pérdida de funcionalidad, facilitando su uso a personas con problemas de visión.

### **Principio 2: Operable**

- **Navegación Completa por Teclado:** Todas las funciones críticas, como navegar por el Dashboard, abrir la sección de Oradores o registrar un Bosquejo, se pueden realizar usando únicamente el teclado.
- **Indicadores de Foco Claros:** Cuando un elemento interactivo recibe el foco (botones, enlaces, cajas de texto), este se resalta de forma visible y clara.
- **Sin Trampas de Foco:** Ningún elemento bloquea la navegación, el usuario siempre puede continuar tabulando libremente.

### **Principio 3: Comprensible**

- **Formularios Accesibles:** Todos los campos de entrada de datos (como el nombre del orador o las fechas de la agenda) tienen sus etiquetas `<label>` correctamente vinculadas al campo a través del atributo `for`.
- **Retroalimentación Visual:** El sistema utiliza distintivos claros de color (Verde para éxito, Rojo para advertencias) y texto para confirmar acciones de la base de datos.
- **Idioma y Lenguaje:** El atributo `<html lang="es">` está definido correctamente, y el vocabulario utilizado es coherente con la terminología de la congregación.

### **Principio 4: Robusto**

- **Compatibilidad Multi-plataforma:** La aplicación ha sido construida respetando los estándares modernos del DOM, lo que asegura su compatibilidad tanto en navegadores de escritorio como en dispositivos móviles, e interactúa de manera predecible con herramientas de asistencia.

---

## 🚧 Áreas de Mejora Continua

La accesibilidad es un trabajo iterativo. Actualmente, nuestro enfoque a futuro incluye:
- Mejorar el soporte para navegación por voz.
- Incorporar notificaciones exclusivas para lectores de pantalla ("aria-live") cuando las tarjetas estadísticas del dashboard se actualicen en tiempo real desde el servidor.
- Revisar a fondo el contraste cromático de los componentes si en el futuro se implementa un "Modo Oscuro" permanente.