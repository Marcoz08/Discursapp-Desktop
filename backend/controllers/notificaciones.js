import pool from '../config/db.js';

export const getSystemNotifications = async (req, res) => {
    try {
        const notifications = [];

        // 1. Condicional: Acuerdos en la agenda que siguen "Pendientes"
        const [pendingAgendas] = await pool.query(
            "SELECT COUNT(*) as total FROM agenda WHERE estatus = 0"
        );
        if (pendingAgendas[0].total > 0) {
            notifications.push({
                tipo: 'agenda',
                mensaje: `${pendingAgendas[0].total} acuerdos pendientes de confirmar`,
                icon: 'bi-calendar-event',
                link: './agenda.html',
                color: 'text-warning'
            });
        }

        // 2. Condicional: Oradores que no están aprobados para salir
        const [pendingSpeakers] = await pool.query(
            "SELECT COUNT(*) as total FROM oradores WHERE aprobado = 0"
        );
        if (pendingSpeakers[0].total > 0) {
            notifications.push({
                tipo: 'oradores',
                mensaje: `${pendingSpeakers[0].total} oradores pendientes de aprobación`,
                icon: 'bi-people-fill',
                link: './oradores.html',
                color: 'text-danger'
            });
        }

        // 3. Condicional: Programación del mes actual con huecos (sin orador asignado)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const [gaps] = await pool.query(
            "SELECT COUNT(*) as total FROM oradores_visitantes WHERE (nombre IS NULL OR nombre = '') AND strftime('%m', fecha_discurso) = ? AND strftime('%Y', fecha_discurso) = ?",
            [(currentMonth + 1).toString().padStart(2, '0'), currentYear.toString()]
        );
        if (gaps[0].total > 0) {
            notifications.push({
                tipo: 'visitas',
                mensaje: `Faltan ${gaps[0].total} discursantes por asignar este mes`,
                icon: 'bi-exclamation-triangle',
                link: './visitantes.html',
                color: 'text-info'
            });
        }

        // 4. Condicional: Recordatorio de principios de mes para agendar meses futuros
        const hoy = new Date();
        const anioActual = hoy.getFullYear();
        const mesActual = hoy.getMonth(); // 0-11
        const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        // Revisar los próximos 2 meses (siempre se muestran si no hay rol agendado)
        for (let i = 1; i <= 2; i++) {
            // Calculamos el primer día del mes objetivo para evitar errores de desbordamiento de días
            const fechaObjetivo = new Date(anioActual, mesActual + i, 1);
            const mesBusqueda = fechaObjetivo.getMonth() + 1; // 1-12
            const anioBusqueda = fechaObjetivo.getFullYear();

            const [agendaMes] = await pool.query(
                `SELECT COUNT(*) as total 
                FROM agenda a 
                JOIN agenda_meses am ON a.id_rol = am.id_rol 
                WHERE am.id_mes = ? AND (strftime('%Y', a.fecha_ini) = ? OR strftime('%Y', a.fecha_fin) = ?)`,
                [mesBusqueda, anioBusqueda.toString(), anioBusqueda.toString()]
            );

            if (agendaMes[0].total === 0) {
                notifications.push({
                    tipo: 'recordatorio_planificacion',
                    mensaje: `Falta agendar el rol de ${nombresMeses[mesBusqueda - 1]} ${anioBusqueda}`,
                    icon: 'bi-calendar-plus-fill',
                    link: './agenda.html',
                    color: 'text-primary'
                });
            }
        }

        // 5. Recordatorio semestral: Actualizar lista de oradores y temas (Enero y Julio)
        if (mesActual === 0 || mesActual === 6) {
            notifications.push({
                tipo: 'mantenimiento_oradores',
                mensaje: `Recordatorio: Actualizar lista de oradores y temas`,
                icon: 'bi-person-lines-fill',
                link: './oradores.html',
                color: 'text-secondary'
            });
        }

        // 6. Recordatorio cuatrimestral: Analizar nuevos oradores (Enero, Mayo, Septiembre)
        if (mesActual === 0 || mesActual === 4 || mesActual === 8) {
            notifications.push({
                tipo: 'analisis_oradores',
                mensaje: `Recordatorio: Analizar nuevos oradores`,
                icon: 'bi-person-plus-fill',
                link: './oradores.html',
                color: 'text-dark'
            });
        }

        // 7. Condicional: Sin orador asignado para la semana actual (Urgente)
        const [currentWeekSpeaker] = await pool.query(
            `SELECT COUNT(*) as total 
            FROM oradores_visitantes 
            WHERE (nombre IS NOT NULL AND nombre != '') 
            AND strftime('%W', fecha_discurso) = strftime('%W', 'now', 'localtime') 
            AND strftime('%Y', fecha_discurso) = strftime('%Y', 'now', 'localtime')`
        );

        if (currentWeekSpeaker[0].total === 0) {
            notifications.push({
                tipo: 'urgente',
                mensaje: `¡URGENTE! No hay orador asignado para esta semana`,
                icon: 'bi-exclamation-octagon-fill',
                link: './visitantes.html',
                color: 'text-danger'
            });
        }

        // 8. Condicional: Revisar programa de visitas del próximo mes (Días 12 al 16)
        const diaDelMes = hoy.getDate();
        if (diaDelMes >= 12 && diaDelMes <= 16) {
            const fechaSiguiente = new Date(anioActual, mesActual + 1, 1);
            const mesSiguienteVal = (fechaSiguiente.getMonth() + 1).toString().padStart(2, '0');
            const anioSiguienteVal = fechaSiguiente.getFullYear().toString();

            // Buscamos si hay registros creados y si alguno está vacío
            const [nextMonthProg] = await pool.query(
                `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN nombre IS NULL OR nombre = '' THEN 1 ELSE 0 END) as vacios
                FROM oradores_visitantes 
                WHERE strftime('%m', fecha_discurso) = ? AND strftime('%Y', fecha_discurso) = ?`,
                [mesSiguienteVal, anioSiguienteVal]
            );

            // Si no hay registros o hay huecos sin nombre
            if (nextMonthProg[0].total === 0 || nextMonthProg[0].vacios > 0) {
                notifications.push({
                    tipo: 'visitas_proximo_mes',
                    mensaje: `ATENCION: El programa de visitas de ${nombresMeses[fechaSiguiente.getMonth()]} no está lleno`,
                    icon: 'bi-calendar-range',
                    link: './visitantes.html',
                    color: 'text-warning'
                });
            }
        }

        // 9. Reglas de los Lunes (Gestión semanal)
        const diaSemana = hoy.getDay(); // 0 = Domingo, 1 = Lunes...
        if (diaSemana === 1) {
            // 9.1 Verificar si el orador del fin de semana pasado no ha sido confirmado
            const [lastWeekUnconfirmed] = await pool.query(
                `SELECT COUNT(*) as total 
                 FROM oradores_visitantes 
                 WHERE asistio = 0 
                 AND strftime('%W', fecha_discurso) = strftime('%W', 'now', '-7 days', 'localtime')
                 AND strftime('%Y', fecha_discurso) = strftime('%Y', 'now', 'localtime')`
            );

            if (lastWeekUnconfirmed[0].total > 0) {
                notifications.push({
                    tipo: 'tarea_pendiente',
                    mensaje: "Confirmar asistencia del orador del fin de semana pasado",
                    icon: 'bi-patch-check-fill',
                    link: './visitantes.html',
                    color: 'text-warning'
                });
            }

            // 9.2 Recordatorio: Contactar al orador visitante de esta semana
            notifications.push({
                tipo: 'recordatorio_lunes',
                mensaje: "Recordatorio: Contactar al orador visitante de esta semana",
                icon: 'bi-telephone-fill',
                link: './visitantes.html',
                color: 'text-info'
            });

            // 9.3 Recordatorio: Informar al orador local de su salida
            notifications.push({
                tipo: 'recordatorio_lunes',
                mensaje: "Recordatorio: Informar al orador local de su salida",
                icon: 'bi-send-fill',
                link: './salidas.html',
                color: 'text-info'
            });
        }

        res.json(notifications);
    } catch (err) {
        console.error('Error al generar notificaciones:', err);
        res.status(500).json({ error: err.message });
    }
};