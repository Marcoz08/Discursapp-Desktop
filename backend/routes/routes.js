import express from 'express';
import * as oradoresController from '../controllers/oradores.js';
import * as bosquejosController from '../controllers/bosquejos.js';
import * as visitantesController from '../controllers/visitantes.js';
import * as agendaController from '../controllers/agenda.js';
import * as salidasController from '../controllers/salidas.js';

const router = express.Router();

// --- Bosquejos ---
router.get('/bosquejos', bosquejosController.getBosquejos);
router.put('/bosquejos/:num', bosquejosController.updateBosquejo);

// --- Oradores ---
router.get('/oradores-temas', oradoresController.getOradoresTemas);
router.delete('/oradores/:id', oradoresController.deleteOrador);
router.post('/oradores', oradoresController.createOrador);
router.put('/oradores/:id', oradoresController.updateOrador);

// --- Temas Orador ---
router.delete('/temas-orador/:id', oradoresController.deleteTema);
router.post('/temas-orador', oradoresController.createTema);
router.put('/temas-orador/:id', oradoresController.updateTema);

// --- Reunión Local ---
router.get('/reunion-local', visitantesController.getReunionLocal);
router.put('/reunion-local/:id', visitantesController.updateReunionLocal);
router.get('/reuniones-especiales-tipos', visitantesController.getTiposReunionEspecial);

// --- Visitantes ---
router.get('/visitantes-programacion', visitantesController.getVisitantesProgramacion);
router.post('/visitantes-programacion', visitantesController.saveVisitantesProgramacion);
router.post('/confirmar-asistencia', visitantesController.confirmarAsistencia);

// --- Agenda ---
router.get('/agenda', agendaController.getAgenda);
router.post('/agenda', agendaController.createAgenda);
router.put('/agenda/:id', agendaController.updateAgenda);
router.delete('/agenda/:id', agendaController.deleteAgenda);
router.get('/agenda/confirmada', agendaController.getAgendaConfirmada);

// --- Salidas ---
router.get('/salidas-programacion', salidasController.getSalidasProgramacion);
router.post('/salidas-programacion', salidasController.saveSalidasProgramacion);

// --- Historial ---
router.get('/salidas/historico', salidasController.getHistoricoSalidas);
router.get('/visitantes/historico', visitantesController.getHistoricoVisitas);

// --- Dashboard ---
router.get('/dashboard/visitante-semana', visitantesController.getVisitanteSemana);
router.get('/dashboard/salida-semana', salidasController.getSalidaSemana);
router.get('/dashboard/ultimos-discursos', bosquejosController.getUltimosDiscursos);

export default router;