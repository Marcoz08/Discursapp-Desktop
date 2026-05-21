const SELECTOR_SIDEBAR_WRAPPER = '.sidebar-wrapper';
const DEFAULT_SCROLL_OPTIONS = {
  scrollbarTheme: 'os-theme-light',
  scrollbarAutoHide: 'leave',
  scrollbarClickScroll: true,
};

function initOverlayScrollbars() {
  const sidebarWrapper = document.querySelector(SELECTOR_SIDEBAR_WRAPPER);
  const isMobile = window.innerWidth <= 992;

  if (
    sidebarWrapper &&
    window.OverlayScrollbarsGlobal?.OverlayScrollbars !== undefined &&
    !isMobile
  ) {
    OverlayScrollbarsGlobal.OverlayScrollbars(sidebarWrapper, {
      scrollbars: {
        theme: DEFAULT_SCROLL_OPTIONS.scrollbarTheme,
        autoHide: DEFAULT_SCROLL_OPTIONS.scrollbarAutoHide,
        clickScroll: DEFAULT_SCROLL_OPTIONS.scrollbarClickScroll,
      },
    });
  }
}

async function updateStats() {
  try {
    const [resOradores, resBosquejos] = await Promise.all([
      fetch('http://localhost:3000/api/oradores-temas'),
      fetch('http://localhost:3000/api/bosquejos'),
    ]);

    if (resOradores.ok) {
      const data = await resOradores.json();
      const unique = new Set(data.filter(o => o.aprobado === 1).map(o => o.id_orador)).size;
      document.getElementById('total-speakers').textContent = unique;
    }

    if (resBosquejos.ok) {
      const data = await resBosquejos.json();
      document.getElementById('total-bosquejos').textContent = data.length;
    }
  } catch (error) {
    console.error('Error stats:', error);
  }
}

async function updateRoles() {
  try {
    const currentYear = new Date().getFullYear();
    const response = await fetch(`http://localhost:3000/api/agenda?anio=${currentYear}`);
    const agenda = await response.json();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const current = agenda.find(item => {
      const start = new Date(item.fecha_ini);
      const end = new Date(item.fecha_fin);
      return today >= start && today <= end;
    });

    const next = agenda.find(item => new Date(item.fecha_ini) > today);

    document.getElementById('current-role-cong').textContent = current ? current.congregacion : 'Sin rol activo';
    document.getElementById('next-role-cong').textContent = next ? next.congregacion : 'Sin programación';
  } catch (error) {
    console.error('Error roles:', error);
  }
}

async function updateWeeklyCards() {
  try {
    const [resVisitor, resExit] = await Promise.all([
      fetch('http://localhost:3000/api/dashboard/visitante-semana'),
      fetch('http://localhost:3000/api/dashboard/salida-semana'),
    ]);

    if (resVisitor.ok) {
      const data = await resVisitor.json();
      document.getElementById('week-visitor-name').textContent = data ? data.nombre : 'Sin visita';
      document.getElementById('week-visitor-theme').textContent = data ? `TEMA: ${data.tema}` : 'No hay orador programado para esta semana.';
    }

    if (resExit.ok) {
      const data = await resExit.json();
      document.getElementById('week-exit-name').textContent = data ? data.nombre : 'Sin salida';
      document.getElementById('week-exit-theme').textContent = data ? `TEMA: ${data.titulo}` : 'Ningún orador local sale esta semana.';
    }
  } catch (error) {
    console.error('Error al cargar info semanal:', error);
    document.getElementById('week-visitor-name').textContent = 'Error';
    document.getElementById('week-exit-name').textContent = 'Error';
  }
}

async function updateRecentSpeeches() {
  const container = document.getElementById('recent-speeches-body');
  if (!container) {
    return;
  }

  container.innerHTML = `
    <tr>
      <td colspan="3" class="text-center p-4">
        <div class="spinner-border text-primary" role="status"></div>
      </td>
    </tr>`;

  try {
    const response = await fetch('http://localhost:3000/api/dashboard/ultimos-discursos');
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    container.innerHTML = '';

    if (data.length === 0) {
      container.innerHTML = '<tr><td colspan="3" class="text-center p-4 text-muted italic">No hay registros de presentaciones recientes.</td></tr>';
      return;
    }

    data.forEach(item => {
      const d = new Date(item.fecha_ult);
      const dateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0]
        .split('-')
        .reverse()
        .join('-');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="text-center fw-bold text-primary">${item.num}</td>
        <td>${item.titulo}</td>
        <td class="text-secondary"><i class="bi bi-calendar-check me-2"></i>${dateStr}</td>
      `;
      container.appendChild(tr);
    });
  } catch (error) {
    console.error('Error al cargar discursos recientes:', error);
  }
}

function initSortableCards() {
  if (typeof Sortable === 'undefined') {
    return;
  }

  const sortableElement = document.querySelector('.connectedSortable');
  if (!sortableElement) {
    return;
  }

  new Sortable(sortableElement, {
    group: 'shared',
    handle: '.card-header',
  });

  document.querySelectorAll('.connectedSortable .card-header').forEach(cardHeader => {
    cardHeader.style.cursor = 'move';
  });
}

function renderSalesChart() {
  if (typeof ApexCharts === 'undefined') {
    return;
  }

  const chartElement = document.querySelector('#revenue-chart');
  if (!chartElement) {
    return;
  }

  const salesChartOptions = {
    series: [
      {
        name: 'Digital Goods',
        data: [28, 48, 40, 19, 86, 27, 90],
      },
      {
        name: 'Electronics',
        data: [65, 59, 80, 81, 56, 55, 40],
      },
    ],
    chart: {
      height: 300,
      type: 'area',
      toolbar: {
        show: false,
      },
    },
    legend: {
      show: false,
    },
    colors: ['#0d6efd', '#20c997'],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
    },
    xaxis: {
      type: 'datetime',
      categories: [
        '2023-01-01',
        '2023-02-01',
        '2023-03-01',
        '2023-04-01',
        '2023-05-01',
        '2023-06-01',
        '2023-07-01',
      ],
    },
    tooltip: {
      x: {
        format: 'MMMM yyyy',
      },
    },
  };

  const salesChart = new ApexCharts(chartElement, salesChartOptions);
  salesChart.render();
}

function initWorldMapAndSparklines() {
  if (typeof jsVectorMap !== 'undefined') {
    const worldMapElement = document.querySelector('#world-map');
    if (worldMapElement) {
      new jsVectorMap({
        selector: '#world-map',
        map: 'world',
      });
    }
  }

  if (typeof ApexCharts === 'undefined') {
    return;
  }

  const sparklineConfig = (data) => ({
    series: [
      {
        data,
      },
    ],
    chart: {
      type: 'area',
      height: 50,
      sparkline: {
        enabled: true,
      },
    },
    stroke: {
      curve: 'straight',
    },
    fill: {
      opacity: 0.3,
    },
    yaxis: {
      min: 0,
    },
    colors: ['#DCE6EC'],
  });

  const sparkline1El = document.querySelector('#sparkline-1');
  if (sparkline1El) {
    new ApexCharts(sparkline1El, sparklineConfig([1000, 1200, 920, 927, 931, 1027, 819, 930, 1021])).render();
  }

  const sparkline2El = document.querySelector('#sparkline-2');
  if (sparkline2El) {
    new ApexCharts(sparkline2El, sparklineConfig([515, 519, 520, 522, 652, 810, 370, 627, 319, 630, 921])).render();
  }

  const sparkline3El = document.querySelector('#sparkline-3');
  if (sparkline3El) {
    new ApexCharts(sparkline3El, sparklineConfig([15, 19, 20, 22, 33, 27, 31, 27, 19, 30, 21])).render();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initOverlayScrollbars();
  initSortableCards();
  renderSalesChart();
  initWorldMapAndSparklines();

  Promise.allSettled([
    updateStats(),
    updateRoles(),
    updateWeeklyCards(),
    updateRecentSpeeches(),
  ]);
});
