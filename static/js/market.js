/**
 * Farm Shift V3 - Market Prices Module (Vanilla JS)
 * Renders indicative Indian agricultural market prices.
 */

const FarmMarket = {
  priceData: null,

  init: async function () {
    const container = document.getElementById('view-market');
    if (!container) return;
    this.renderLoading(container);
    const data = await this.fetchPrices();
    this.priceData = data;
    this.renderMarketView(container, data);
  },

  fetchPrices: async function (crop, region) {
    try {
      let url = '/api/market/prices';
      const params = [];
      if (crop) params.push(`crop=${encodeURIComponent(crop)}`);
      if (region) params.push(`region=${encodeURIComponent(region)}`);
      if (params.length) url += '?' + params.join('&');
      const r = await fetch(url);
      return await r.json();
    } catch (e) {
      return { status: 'error', prices: [], disclaimer: 'Could not load prices.' };
    }
  },

  renderLoading: function (container) {
    container.innerHTML = `
      <div class="v3-panel" style="text-align:center;padding:3rem;">
        <div class="loading-spinner" style="margin:0 auto 1rem;"></div>
        <p style="color:var(--text-muted)">Loading market prices…</p>
      </div>
    `;
  },

  renderMarketView: function (container, data) {
    const prices = data.prices || [];
    const crops = [...new Set(prices.map(p => p.crop))].sort();
    const states = [...new Set(prices.map(p => p.state))].sort();

    container.innerHTML = `
      <div class="v3-prediction-container">
        <!-- Header -->
        <div class="v3-panel" style="margin-bottom:1rem;">
          <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
            <div>
              <h2 style="margin:0;color:var(--text-primary)">📊 Market Price Reference</h2>
              <p style="margin:0.25rem 0 0;color:var(--text-muted);font-size:0.875rem;">${data.source || ''}</p>
            </div>
            <div class="risk-badge medium" style="margin-left:auto;">⚠️ Indicative Only — Not Live Data</div>
          </div>
          <div class="auth-error" style="display:block;margin-top:0.75rem;padding:0.6rem 1rem;border-radius:8px;font-size:0.82rem;">
            ${data.disclaimer || ''}
          </div>
        </div>

        <!-- Filters -->
        <div class="v3-panel" style="margin-bottom:1rem;display:flex;gap:1rem;flex-wrap:wrap;align-items:center;">
          <div class="auth-field" style="margin:0;flex:1;min-width:140px;">
            <label for="market-crop-filter">Filter by Crop</label>
            <select id="market-crop-filter" class="auth-field select-input">
              <option value="">All Crops</option>
              ${crops.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="auth-field" style="margin:0;flex:1;min-width:140px;">
            <label for="market-state-filter">Filter by State</label>
            <select id="market-state-filter" class="auth-field select-input">
              <option value="">All States</option>
              ${states.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
          <button class="auth-btn auth-btn-primary" onclick="FarmMarket._applyFilters()" style="margin-top:1.4rem;">Apply</button>
          <button class="auth-btn auth-btn-ghost" onclick="FarmMarket._resetFilters()" style="margin-top:1.4rem;">Reset</button>
        </div>

        <!-- Chart -->
        <div class="v3-panel" style="margin-bottom:1rem;">
          <h3 style="margin:0 0 1rem;color:var(--text-primary);font-size:1rem;">Top Prices by Commodity (₹/quintal)</h3>
          <div class="climate-chart-wrap">
            <canvas id="market-price-chart" width="700" height="260"></canvas>
          </div>
        </div>

        <!-- Price Cards Grid -->
        <div id="market-price-grid" class="market-price-grid">
          ${this._renderPriceCards(prices)}
        </div>

        <!-- Footer -->
        <div class="v3-panel" style="margin-top:1rem;font-size:0.8rem;color:var(--text-muted);text-align:center;">
          Data reference: APMC/e-NAM South India historical averages. Last reference date: ${data.last_updated || 'N/A'}
        </div>
      </div>
    `;

    // Bind filters
    document.getElementById('market-crop-filter').addEventListener('change', () => this._applyFilters());
    document.getElementById('market-state-filter').addEventListener('change', () => this._applyFilters());

    // Draw chart
    setTimeout(() => this.renderPriceChart('market-price-chart', prices.slice(0, 10)), 100);
  },

  _renderPriceCards: function (prices) {
    if (!prices.length) return '<div class="v3-panel" style="text-align:center;color:var(--text-muted);">No prices match the selected filters.</div>';
    return prices.map(p => {
      const range = p.max_price - p.min_price;
      const modalOffset = range > 0 ? Math.round(((p.modal_price - p.min_price) / range) * 100) : 50;
      const cropIcons = {
        'Rice': '🌾', 'Wheat': '🌾', 'Banana': '🍌', 'Coconut': '🥥',
        'Rubber': '🌳', 'Pepper': '⚫', 'Cardamom': '🌿', 'Turmeric': '🟡',
        'Ginger': '🫚', 'Tomato': '🍅', 'Onion': '🧅', 'Groundnut': '🥜',
        'Cassava': '🍠', 'Black Gram': '🫘', 'Green Gram': '🫘'
      };
      const icon = cropIcons[p.crop] || '🌱';
      return `
        <div class="market-price-card">
          <div class="market-price-card-header">
            <span class="market-crop-icon">${icon}</span>
            <div>
              <div class="market-crop-name">${p.crop}</div>
              <div class="market-variety">${p.variety}</div>
            </div>
          </div>
          <div class="market-modal-price">₹${p.modal_price.toLocaleString('en-IN')}<span class="market-unit">/${p.unit}</span></div>
          <div class="market-price-range-labels">
            <span>₹${p.min_price.toLocaleString('en-IN')} min</span>
            <span>₹${p.max_price.toLocaleString('en-IN')} max</span>
          </div>
          <div class="price-range-bar">
            <div class="price-range-fill"></div>
            <div class="price-modal-marker" style="left:${modalOffset}%;" title="Modal price"></div>
          </div>
          <div class="market-price-meta">
            <span>📍 ${p.market}, ${p.state}</span>
            <span>📅 ${p.date || 'Today'}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  renderPriceChart: function (canvasId, prices) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 700;
    const H = 260;
    canvas.width = W;
    canvas.height = H;

    // Take top 10 by modal price (normalize per quintal for display)
    const displayPrices = prices
      .filter(p => p.unit === 'quintal' || !p.unit.includes('1000'))
      .slice(0, 10);

    if (!displayPrices.length) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText('No data for chart', W / 2 - 60, H / 2);
      return;
    }

    const maxPrice = Math.max(...displayPrices.map(p => p.modal_price));
    const paddingLeft = 110;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;
    const chartW = W - paddingLeft - paddingRight;
    const barH = Math.floor((H - paddingTop - paddingBottom) / displayPrices.length) - 4;

    ctx.clearRect(0, 0, W, H);

    displayPrices.forEach((p, i) => {
      const barW = Math.round((p.modal_price / maxPrice) * chartW);
      const y = paddingTop + i * (barH + 4);

      // Gradient bar
      const grad = ctx.createLinearGradient(paddingLeft, 0, paddingLeft + barW, 0);
      grad.addColorStop(0, 'rgba(74,222,128,0.85)');
      grad.addColorStop(1, 'rgba(34,197,94,0.4)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(paddingLeft, y, barW, barH, 4);
      ctx.fill();

      // Crop label
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(p.crop, paddingLeft - 6, y + barH / 2 + 4);

      // Price label
      ctx.fillStyle = '#4ade80';
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(`₹${p.modal_price.toLocaleString('en-IN')}`, paddingLeft + barW + 4, y + barH / 2 + 4);
    });

    // X-axis label
    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Modal Price (₹/quintal)', paddingLeft + chartW / 2, H - 8);
  },

  filterPrices: function (crop, state) {
    if (!this.priceData) return;
    let prices = this.priceData.prices || [];
    if (crop) prices = prices.filter(p => p.crop === crop);
    if (state) prices = prices.filter(p => p.state === state);
    const grid = document.getElementById('market-price-grid');
    if (grid) grid.innerHTML = this._renderPriceCards(prices);
    this.renderPriceChart('market-price-chart', prices.slice(0, 10));
  },

  _applyFilters: function () {
    const crop = document.getElementById('market-crop-filter')?.value || '';
    const state = document.getElementById('market-state-filter')?.value || '';
    this.filterPrices(crop, state);
  },

  _resetFilters: function () {
    const cropEl = document.getElementById('market-crop-filter');
    const stateEl = document.getElementById('market-state-filter');
    if (cropEl) cropEl.value = '';
    if (stateEl) stateEl.value = '';
    this.filterPrices('', '');
  }
};
