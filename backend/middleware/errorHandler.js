/**
 * Middleware para capturar rutas (endpoints) no encontrados.
 */
export const notFoundHandler = (req, res, next) => {
    const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

/**
 * Middleware global para el manejo de errores.
 * Captura cualquier error lanzado en las rutas o controladores.
 */
export const errorHandler = (err, req, res, next) => {
    // Si el error no tiene un código de estado definido, usamos 500 (Error interno)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    console.error(`[Error API]: ${err.message}`);

    res.status(statusCode).json({
        error: err.message || 'Error interno del servidor',
        // El stack trace solo se muestra en desarrollo para facilitar la depuración
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};