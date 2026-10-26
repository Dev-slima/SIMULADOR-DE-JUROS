/**
 * SIMULADOR DE RENDIMENTOS - CALCULADORA DE JUROS COMPOSTOS
 * Desenvolvido com JavaScript Puro (Vanilla JS) - Alta Performance e Zero Dependências
 */

(function () {
  'use strict';

  // --- Elementos do DOM ---
  const form = document.getElementById('calc-form');
  const btnClear = document.getElementById('btn-clear');
  
  // Inputs
  const inputInitial = document.getElementById('initial-amount');
  const inputMonthly = document.getElementById('monthly-amount');
  const inputRate = document.getElementById('interest-rate');
  const selectRateType = document.getElementById('rate-type');
  const inputPeriod = document.getElementById('period-time');
  const selectPeriodType = document.getElementById('period-type');

  // Outputs de Métricas
  const outTotalFinal = document.getElementById('out-total-final');
  const outTotalInvested = document.getElementById('out-total-invested');
  const outTotalInterest = document.getElementById('out-total-interest');
  const badgeProfitability = document.getElementById('badge-profitability');
  const subProfitability = document.getElementById('sub-profitability');

  // Barra de Proporção
  const barInvested = document.getElementById('bar-invested');
  const barInterest = document.getElementById('bar-interest');
  const pctInvested = document.getElementById('pct-invested');
  const pctInterest = document.getElementById('pct-interest');

  // Tabela e Controles
  const tableBody = document.getElementById('evolution-tbody');
  const btnViewAnnual = document.getElementById('view-annual');
  const btnViewMonthly = document.getElementById('view-monthly');
  const colPeriodName = document.getElementById('col-period-name');
  const btnExportCSV = document.getElementById('btn-export-csv');

  // Chips Rápidos
  const periodChips = document.querySelectorAll('.chip-btn');
  const benchmarkChips = document.querySelectorAll('.benchmark-chip');

  // Container do Gráfico SVG
  const chartContainer = document.getElementById('chart-container');
  const chartTooltip = document.getElementById('chart-tooltip');

  // Estado Atual dos Dados Calculados
  let currentResults = null;
  let currentViewMode = 'annual'; // 'annual' ou 'monthly'

  // --- Formatadores Numéricos (Intl) ---
  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const percentFormatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  /**
   * Converte texto formatado em moeda (ex: "10.000,00" ou "R$ 1.500,50") para float puro.
   */
  function parseCurrencyToNumber(valueStr) {
    if (!valueStr) return 0;
    const cleaned = valueStr.toString().replace(/[^\d.,]/g, '');
    if (!cleaned) return 0;

    if (cleaned.includes(',')) {
      const normalized = cleaned.replace(/\./g, '').replace(',', '.');
      return parseFloat(normalized) || 0;
    }
    return parseFloat(cleaned) || 0;
  }

  /**
   * Formata valor numérico puro para texto de moeda brasileira R$
   */
  function formatMoney(value) {
    return currencyFormatter.format(value || 0);
  }

  /**
   * Configuração de input amigável para digitação monetária
   */
  function setupCurrencyInput(input) {
    input.addEventListener('input', (e) => {
      const original = e.target.value;
      const sanitized = original.replace(/[^\d.,]/g, '');
      if (original !== sanitized) {
        e.target.value = sanitized;
      }
    });

    input.addEventListener('focus', (e) => {
      if (e.target.value === '0,00' || e.target.value === '0') {
        e.target.value = '';
      } else {
        e.target.select();
      }
    });

    input.addEventListener('blur', (e) => {
      const num = parseCurrencyToNumber(e.target.value);
      e.target.value = num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    });
  }

  // --- Função Principal de Cálculo Financeiro ---
  function calculateCompoundInterest() {
    const initialAmount = parseCurrencyToNumber(inputInitial.value);
    const monthlyAmount = parseCurrencyToNumber(inputMonthly.value);
    const rawRate = parseFloat(inputRate.value.replace(',', '.')) || 0;
    const rateType = selectRateType.value; // 'monthly' ou 'annual'
    const rawPeriod = parseInt(inputPeriod.value, 10) || 0;
    const periodType = selectPeriodType.value; // 'months' ou 'years'

    if (rawPeriod <= 0) {
      alert('Por favor, informe um período de tempo maior que zero.');
      inputPeriod.focus();
      return;
    }

    if (rawRate < 0) {
      alert('A taxa de juros não pode ser negativa.');
      inputRate.focus();
      return;
    }

    // Normalização do período total para meses
    const totalMonths = periodType === 'years' ? rawPeriod * 12 : rawPeriod;

    // Normalização da taxa de juros para taxa mensal equivalente composta
    // Se a taxa for anual: i_m = (1 + i_a)^(1/12) - 1
    let monthlyRateDecimal = 0;
    if (rateType === 'annual') {
      const annualDecimal = rawRate / 100;
      monthlyRateDecimal = Math.pow(1 + annualDecimal, 1 / 12) - 1;
    } else {
      monthlyRateDecimal = rawRate / 100;
    }

    // Construção da série mês a mês
    let currentBalance = initialAmount;
    let totalInvested = initialAmount;
    let totalInterestAccumulated = 0;

    const monthlyBreakdown = [
      {
        month: 0,
        year: 0,
        interestEarned: 0,
        totalInterest: 0,
        totalInvested: initialAmount,
        balance: initialAmount,
      }
    ];

    for (let m = 1; m <= totalMonths; m++) {
      // Rendimento do mês sobre o saldo anterior
      const interestThisMonth = currentBalance * monthlyRateDecimal;
      
      // Novo saldo antes do aporte
      currentBalance += interestThisMonth;

      // Aporte mensal adicionado no final do mês
      currentBalance += monthlyAmount;
      totalInvested += monthlyAmount;

      totalInterestAccumulated = currentBalance - totalInvested;

      monthlyBreakdown.push({
        month: m,
        year: Math.ceil(m / 12),
        interestEarned: interestThisMonth,
        totalInterest: totalInterestAccumulated,
        totalInvested: totalInvested,
        balance: currentBalance,
      });
    }

    const finalBalance = currentBalance;
    const finalInterest = totalInterestAccumulated;
    const profitPercentage = totalInvested > 0 ? (finalInterest / totalInvested) * 100 : 0;

    currentResults = {
      initialAmount,
      monthlyAmount,
      rawRate,
      rateType,
      totalMonths,
      periodType,
      rawPeriod,
      finalBalance,
      totalInvested,
      finalInterest,
      profitPercentage,
      monthlyBreakdown,
    };

    updateDashboard(currentResults);
  }

  // --- Animação Suave Count-Up nos Valores ---
  function animateValue(element, start, end, duration, isCurrency = true) {
    const startTime = performance.now();
    element.classList.remove('value-updated');
    void element.offsetWidth; // Forçar reflow para reiniciar animação
    element.classList.add('value-updated');

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * ease;

      if (isCurrency) {
        element.textContent = formatMoney(current);
      } else {
        element.textContent = percentFormatter.format(current) + '%';
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        if (isCurrency) {
          element.textContent = formatMoney(end);
        } else {
          element.textContent = percentFormatter.format(end) + '%';
        }
      }
    }

    requestAnimationFrame(update);
  }

  // --- Atualização da Interface com os Resultados ---
  function updateDashboard(data) {
    // 1. Atualizar Métricas Principais
    animateValue(outTotalFinal, 0, data.finalBalance, 800, true);
    animateValue(outTotalInvested, 0, data.totalInvested, 800, true);
    animateValue(outTotalInterest, 0, data.finalInterest, 800, true);

    const profitText = `+${percentFormatter.format(data.profitPercentage)}%`;
    badgeProfitability.textContent = profitText;
    subProfitability.textContent = `Rendimento total de ${percentFormatter.format(data.profitPercentage)}% sobre o capital investido.`;

    // 2. Atualizar Barra de Proporção
    const total = data.finalBalance > 0 ? data.finalBalance : 1;
    const pctInv = Math.max(0, Math.min(100, (data.totalInvested / total) * 100));
    const pctInt = Math.max(0, Math.min(100, (data.finalInterest / total) * 100));

    barInvested.style.width = `${pctInv.toFixed(1)}%`;
    barInterest.style.width = `${pctInt.toFixed(1)}%`;
    pctInvested.textContent = `${pctInv.toFixed(1)}%`;
    pctInterest.textContent = `${pctInt.toFixed(1)}%`;

    // 3. Renderizar Gráfico SVG
    renderSVGChart(data);

    // 4. Renderizar Tabela
    renderEvolutionTable();
  }

  // --- Renderização do Gráfico SVG Dinâmico ---
  function renderSVGChart(data) {
    const list = data.monthlyBreakdown;
    if (!list || list.length === 0) return;

    const width = 800;
    const height = 240;
    const padding = { top: 20, right: 30, bottom: 35, left: 75 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...list.map(d => d.balance), 1);
    const count = list.length;

    // Gerador de pontos para SVG
    const getX = (index) => padding.left + (index / (count - 1 || 1)) * innerW;
    const getY = (val) => padding.top + innerH - (val / maxVal) * innerH;

    // Linha Total Acumulado
    const balancePoints = list.map((d, i) => `${getX(i).toFixed(1)},${getY(d.balance).toFixed(1)}`).join(' ');
    // Linha Total Investido
    const investedPoints = list.map((d, i) => `${getX(i).toFixed(1)},${getY(d.totalInvested).toFixed(1)}`).join(' ');

    // Área sob a curva de Total Acumulado
    const areaBalance = `${balancePoints} ${getX(count - 1)},${padding.top + innerH} ${getX(0)},${padding.top + innerH}`;
    // Área sob o Total Investido
    const areaInvested = `${investedPoints} ${getX(count - 1)},${padding.top + innerH} ${getX(0)},${padding.top + innerH}`;

    // Linhas de Grade Horizontais
    const gridCount = 4;
    let gridLinesHTML = '';
    for (let i = 0; i <= gridCount; i++) {
      const yVal = padding.top + (innerH / gridCount) * i;
      const refMoney = maxVal * (1 - i / gridCount);
      gridLinesHTML += `
        <line x1="${padding.left}" y1="${yVal}" x2="${width - padding.right}" y2="${yVal}" stroke="#e2e8f0" stroke-dasharray="4 4" stroke-width="1"/>
        <text x="${padding.left - 10}" y="${yVal + 4}" fill="#64748b" font-size="10" text-anchor="end" font-weight="500">
          ${formatMoney(refMoney).split(',')[0]}
        </text>
      `;
    }

    // Rótulos do Eixo X (amostrados para não poluir)
    let xLabelsHTML = '';
    const labelSteps = Math.min(count - 1, 6);
    for (let s = 0; s <= labelSteps; s++) {
      const idx = Math.round((s / labelSteps) * (count - 1));
      const item = list[idx];
      const posX = getX(idx);
      const labelText = item.month === 0 ? 'Início' : `${item.month}m`;
      xLabelsHTML += `
        <text x="${posX}" y="${height - 10}" fill="#64748b" font-size="11" text-anchor="middle" font-weight="500">
          ${labelText}
        </text>
      `;
    }

    // Pontos Interativos com identificador
    let interactivePointsHTML = '';
    list.forEach((d, i) => {
      const cx = getX(i);
      const cy = getY(d.balance);
      interactivePointsHTML += `
        <circle class="chart-point" data-idx="${i}" cx="${cx}" cy="${cy}" r="4.5" fill="#1d4ed8" stroke="#ffffff" stroke-width="2" style="cursor:pointer; opacity: 0; transition: opacity 0.15s;" />
      `;
    });

    const svgHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="none" style="touch-action: none;">
        <defs>
          <linearGradient id="balanceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.30"/>
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.01"/>
          </linearGradient>
          <linearGradient id="investedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#94a3b8" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="#94a3b8" stop-opacity="0.01"/>
          </linearGradient>
        </defs>

        <!-- Grade -->
        ${gridLinesHTML}

        <!-- Áreas -->
        <polygon points="${areaInvested}" fill="url(#investedGrad)" />
        <polygon points="${areaBalance}" fill="url(#balanceGrad)" />

        <!-- Linhas -->
        <polyline fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-dasharray="3 3" points="${investedPoints}" />
        <polyline fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${balancePoints}" />

        <!-- Eixo X Labels -->
        ${xLabelsHTML}

        <!-- Pontos Interativos -->
        ${interactivePointsHTML}
      </svg>
    `;

    chartContainer.innerHTML = svgHTML;

    // Configurar Tooltip com Suporte a Mouse e Toque (Pointer Events)
    const svgElem = chartContainer.querySelector('svg');
    const points = svgElem.querySelectorAll('.chart-point');

    function handlePointer(clientX) {
      const rect = svgElem.getBoundingClientRect();
      const pointerX = clientX - rect.left;
      const normalizedX = (pointerX / rect.width) * width;

      // Encontrar ponto mais próximo no eixo X
      let closestIdx = 0;
      let minDistance = Infinity;

      list.forEach((d, i) => {
        const px = getX(i);
        const dist = Math.abs(px - normalizedX);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      });

      const targetItem = list[closestIdx];
      const targetPoint = points[closestIdx];

      points.forEach(p => p.style.opacity = '0');
      if (targetPoint) targetPoint.style.opacity = '1';

      // Posiciona Tooltip
      const screenX = (getX(closestIdx) / width) * rect.width;
      const screenY = (getY(targetItem.balance) / height) * rect.height;

      chartTooltip.innerHTML = `
        <strong>${targetItem.month === 0 ? 'Mês Inicial' : `Mês ${targetItem.month}`}</strong><br/>
        Total: ${formatMoney(targetItem.balance)}<br/>
        Investido: ${formatMoney(targetItem.totalInvested)}<br/>
        Juros: ${formatMoney(targetItem.totalInterest)}
      `;
      chartTooltip.style.left = `${screenX}px`;
      chartTooltip.style.top = `${screenY}px`;
      chartTooltip.style.opacity = '1';
    }

    svgElem.addEventListener('pointermove', (e) => {
      handlePointer(e.clientX);
    });

    svgElem.addEventListener('pointerdown', (e) => {
      handlePointer(e.clientX);
    });

    svgElem.addEventListener('pointerleave', () => {
      points.forEach(p => p.style.opacity = '0');
      chartTooltip.style.opacity = '0';
    });
  }

  // --- Renderização da Tabela de Evolução (Anual / Mensal) ---
  function renderEvolutionTable() {
    if (!currentResults) return;

    const data = currentResults.monthlyBreakdown;
    tableBody.innerHTML = '';

    if (currentViewMode === 'annual') {
      colPeriodName.textContent = 'Ano';

      const yearsSet = new Set(data.map(d => d.year).filter(y => y > 0));
      const annualRows = [];

      // Mês 0 (Início)
      annualRows.push({
        label: 'Início',
        interestEarned: 0,
        totalInterest: 0,
        totalInvested: data[0].totalInvested,
        balance: data[0].balance,
      });

      yearsSet.forEach(year => {
        const monthsInYear = data.filter(d => d.year === year);
        const lastMonthInYear = monthsInYear[monthsInYear.length - 1];
        
        // Juros ganhos especificamente neste ano
        const interestInThisYear = monthsInYear.reduce((acc, curr) => acc + curr.interestEarned, 0);

        annualRows.push({
          label: `Ano ${year}`,
          interestEarned: interestInThisYear,
          totalInterest: lastMonthInYear.totalInterest,
          totalInvested: lastMonthInYear.totalInvested,
          balance: lastMonthInYear.balance,
        });
      });

      annualRows.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="val-bold">${row.label}</td>
          <td class="val-positive">+ ${formatMoney(row.interestEarned)}</td>
          <td class="val-positive">${formatMoney(row.totalInterest)}</td>
          <td>${formatMoney(row.totalInvested)}</td>
          <td class="val-bold">${formatMoney(row.balance)}</td>
        `;
        tableBody.appendChild(tr);
      });

    } else {
      colPeriodName.textContent = 'Mês';

      data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="val-bold">${item.month === 0 ? 'Início' : `Mês ${item.month}`}</td>
          <td class="val-positive">${item.month === 0 ? '-' : `+ ${formatMoney(item.interestEarned)}`}</td>
          <td class="val-positive">${formatMoney(item.totalInterest)}</td>
          <td>${formatMoney(item.totalInvested)}</td>
          <td class="val-bold">${formatMoney(item.balance)}</td>
        `;
        tableBody.appendChild(tr);
      });
    }
  }

  // --- Exportar Dados para CSV ---
  function exportCSV() {
    if (!currentResults) return;
    const isAnnual = currentViewMode === 'annual';
    const filename = `simulacao_rendimentos_${isAnnual ? 'anual' : 'mensal'}.csv`;

    let csvContent = '\uFEFF'; // BOM para compatibilidade com Excel em PT-BR
    csvContent += 'Período;Rendimento no Período (R$);Total em Juros (R$);Total Investido (R$);Saldo Acumulado (R$)\r\n';

    if (isAnnual) {
      const yearsSet = new Set(currentResults.monthlyBreakdown.map(d => d.year).filter(y => y > 0));
      
      const start = currentResults.monthlyBreakdown[0];
      csvContent += `Início;0,00;0,00;${start.totalInvested.toFixed(2).replace('.', ',')};${start.balance.toFixed(2).replace('.', ',')}\r\n`;

      yearsSet.forEach(year => {
        const monthsInYear = currentResults.monthlyBreakdown.filter(d => d.year === year);
        const lastMonthInYear = monthsInYear[monthsInYear.length - 1];
        const interestInThisYear = monthsInYear.reduce((acc, curr) => acc + curr.interestEarned, 0);

        csvContent += `Ano ${year};${interestInThisYear.toFixed(2).replace('.', ',')};${lastMonthInYear.totalInterest.toFixed(2).replace('.', ',')};${lastMonthInYear.totalInvested.toFixed(2).replace('.', ',')};${lastMonthInYear.balance.toFixed(2).replace('.', ',')}\r\n`;
      });
    } else {
      currentResults.monthlyBreakdown.forEach(item => {
        const periodName = item.month === 0 ? 'Início' : `Mês ${item.month}`;
        csvContent += `${periodName};${item.interestEarned.toFixed(2).replace('.', ',')};${item.totalInterest.toFixed(2).replace('.', ',')};${item.totalInvested.toFixed(2).replace('.', ',')};${item.balance.toFixed(2).replace('.', ',')}\r\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- Reset do Formulário ---
  function resetForm() {
    inputInitial.value = '10.000,00';
    inputMonthly.value = '500,00';
    inputRate.value = '12';
    selectRateType.value = 'annual';
    inputPeriod.value = '5';
    selectPeriodType.value = 'years';
    currentViewMode = 'annual';

    periodChips.forEach(c => {
      if (c.getAttribute('data-period') === '5') {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });

    btnViewAnnual.classList.add('active');
    btnViewMonthly.classList.remove('active');

    calculateCompoundInterest();
  }

  // --- Configurar Atalhos de Chips ---
  function setupChips() {
    // Chips de Período
    periodChips.forEach(chip => {
      chip.addEventListener('click', () => {
        periodChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        inputPeriod.value = chip.getAttribute('data-period');
        selectPeriodType.value = chip.getAttribute('data-unit') || 'years';
        calculateCompoundInterest();
      });
    });

    // Chips de Taxa de Referência
    benchmarkChips.forEach(chip => {
      chip.addEventListener('click', () => {
        inputRate.value = chip.getAttribute('data-rate');
        selectRateType.value = chip.getAttribute('data-type') || 'annual';
        calculateCompoundInterest();
      });
    });

    // Se o usuário alterar manualmente o input de período, sincronizar chips
    inputPeriod.addEventListener('input', () => {
      const currentVal = inputPeriod.value;
      const isYears = selectPeriodType.value === 'years';
      periodChips.forEach(chip => {
        if (isYears && chip.getAttribute('data-period') === currentVal) {
          chip.classList.add('active');
        } else {
          chip.classList.remove('active');
        }
      });
    });
  }

  // --- Event Listeners ---
  function setupEvents() {
    // Formatação nos inputs monetários
    setupCurrencyInput(inputInitial);
    setupCurrencyInput(inputMonthly);

    // Atalhos dos Chips
    setupChips();

    // Submissão do Formulário
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      calculateCompoundInterest();
    });

    // Botão Limpar
    btnClear.addEventListener('click', (e) => {
      e.preventDefault();
      resetForm();
    });

    // Botão Exportar CSV
    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', exportCSV);
    }

    // Alternador de Visualização da Tabela (Anual / Mensal)
    btnViewAnnual.addEventListener('click', () => {
      if (currentViewMode !== 'annual') {
        currentViewMode = 'annual';
        btnViewAnnual.classList.add('active');
        btnViewMonthly.classList.remove('active');
        renderEvolutionTable();
      }
    });

    btnViewMonthly.addEventListener('click', () => {
      if (currentViewMode !== 'monthly') {
        currentViewMode = 'monthly';
        btnViewMonthly.classList.add('active');
        btnViewAnnual.classList.remove('active');
        renderEvolutionTable();
      }
    });

    // Recálculo ao redimensionar a janela para manter o SVG perfeitamente ajustado
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (currentResults) {
          renderSVGChart(currentResults);
        }
      }, 120);
    });
  }

  // Inicialização ao carregar a página
  document.addEventListener('DOMContentLoaded', () => {
    setupEvents();
    // Cálculo inicial de demonstração imediata
    calculateCompoundInterest();
  });

})();
