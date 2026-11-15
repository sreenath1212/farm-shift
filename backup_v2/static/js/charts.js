/**
 * Farm Shift V1 - High-Performance Canvas Charts & Sparklines
 * NASA Farm Insights Dashboard
 */

const FarmCharts = {
  // Render smooth neon sparkline on an HTML5 canvas
  drawSparkline: function(canvasId, dataPoints, strokeColor, glowColor, fillColor = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Handle high DPI displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width || canvas.clientWidth || 160;
    const height = rect.height || canvas.clientHeight || 36;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (!dataPoints || dataPoints.length < 2) return;

    const min = Math.min(...dataPoints);
    const max = Math.max(...dataPoints);
    const range = (max - min) === 0 ? 1 : (max - min);
    const padding = 4;
    const usableH = height - (padding * 2);

    const stepX = (width - padding * 2) / (dataPoints.length - 1);
    const points = dataPoints.map((val, idx) => ({
      x: padding + (idx * stepX),
      y: height - padding - ((val - min) / range * usableH)
    }));

    // Draw area fill if provided
    if (fillColor) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, height);
      ctx.lineTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX = (p0.x + p1.x) / 2;
        ctx.bezierCurveTo(cpX, p0.y, cpX, p1.y, p1.x, p1.y);
      }
      ctx.lineTo(points[points.length - 1].x, height);
      ctx.closePath();
      
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, fillColor);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Glow effect
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Line path
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      ctx.bezierCurveTo(cpX, p0.y, cpX, p1.y, p1.x, p1.y);
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // Final point dot
    const lastP = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(lastP.x, lastP.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
  },

  // Draw USDA NASS Multi-Line Trend Chart (2021 to 2025)
  drawFarmTrends: function(canvasId, trendsData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width || canvas.clientWidth || 240;
    const height = rect.height || canvas.clientHeight || 75;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const padLeft = 24;
    const padRight = 10;
    const padTop = 6;
    const padBottom = 16;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // Y Axis labels (0, 50, 100)
    ctx.fillStyle = '#64748b';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const yLevels = [0, 50, 100];
    yLevels.forEach(lvl => {
      const y = padTop + plotH - (lvl / 100 * plotH);
      ctx.fillText(lvl, padLeft - 6, y);
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    const years = trendsData.years || [2021, 2022, 2023, 2024, 2025];
    const stepX = plotW / (years.length - 1);

    // X Axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    years.forEach((yr, idx) => {
      const x = padLeft + (idx * stepX);
      ctx.fillText(yr, x, height - padBottom + 4);
    });

    // Draw each crop curve
    const crops = trendsData.crops || {};
    Object.keys(crops).forEach(cropName => {
      const crop = crops[cropName];
      const vals = crop.values;
      const color = crop.color;

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 4;
      ctx.beginPath();

      const pts = vals.map((v, i) => ({
        x: padLeft + (i * stepX),
        y: padTop + plotH - (v / 100 * plotH)
      }));

      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const cpX = (p0.x + p1.x) / 2;
        ctx.bezierCurveTo(cpX, p0.y, cpX, p1.y, p1.x, p1.y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw dots on points
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });

      ctx.restore();
    });
  },

  // Refresh all dashboard charts with latest data
  renderAll: function(farmData) {
    if (!farmData) return;

    // 1. Desktop KPI Sparklines
    if (farmData.kpis) {
      if (farmData.kpis.crop_health) {
        this.drawSparkline('chart-crop-health', farmData.kpis.crop_health.history, '#22c55e', 'rgba(34, 197, 94, 0.6)');
      }
      if (farmData.kpis.soil_moisture) {
        this.drawSparkline('chart-soil-moisture', farmData.kpis.soil_moisture.history, '#38bdf8', 'rgba(56, 189, 248, 0.6)');
      }
      if (farmData.kpis.temperature) {
        this.drawSparkline('chart-temperature', farmData.kpis.temperature.history, '#f97316', 'rgba(249, 115, 22, 0.6)');
      }
    }

    // 2. Weather Mini Curve
    if (farmData.weather && farmData.weather.forecast_spark) {
      this.drawSparkline('chart-weather-spark', farmData.weather.forecast_spark, '#facc15', 'rgba(250, 204, 21, 0.5)');
    }

    // 3. Water Usage Wave
    if (farmData.water_usage && farmData.water_usage.daily_curve) {
      this.drawSparkline(
        'chart-water-usage',
        farmData.water_usage.daily_curve,
        '#38bdf8',
        'rgba(56, 189, 248, 0.6)',
        'rgba(56, 189, 248, 0.25)'
      );
    }

    // 4. Farm Trends USDA Multi-line Chart
    if (farmData.farm_trends) {
      this.drawFarmTrends('chart-farm-trends', farmData.farm_trends);
    }
  }
};

