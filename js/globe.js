// Export page hero — auto-rotating globe with pins on every market
// listed under "Where to Find Miguelitos".
(function () {
  var host = document.getElementById('export-globe');
  if (!host || typeof d3 === 'undefined' || !d3.geoOrthographic) return;

  // side: which side of the pin the label sits on; dy: extra vertical
  // offset. Both keep the names of neighbouring pins from overlapping.
  var MARKETS = [
    { name: 'Philippines', coords: [120.98, 14.6], side: 1 },
    { name: 'Australia', coords: [151.21, -33.87], side: 1 },
    { name: 'United States', coords: [-118.24, 34.05], side: 1 },
    { name: 'United Kingdom', coords: [-0.13, 51.51], side: -1 },
    { name: 'Singapore', coords: [103.82, 1.35], side: 1 },
    { name: 'UAE', coords: [55.27, 25.2], side: 1 },
    { name: 'Qatar', coords: [51.53, 25.29], side: 1, dy: -15 },
    { name: 'Saudi Arabia', coords: [46.68, 24.71], side: -1 },
    { name: 'Canada', coords: [-123.12, 49.28], side: -1 },
    { name: 'Japan', coords: [139.69, 35.69], side: 1 },
    { name: 'Norway', coords: [10.75, 59.91], side: 1 },
    { name: 'Italy', coords: [12.5, 41.9], side: 1 }
  ];

  var canvas = document.createElement('canvas');
  host.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var projection = d3.geoOrthographic().clipAngle(90);
  var path = d3.geoPath(projection, ctx);
  var graticule = d3.geoGraticule10();
  var land = null;
  var size = 0;
  var lambda = -100;
  var phi = -18;
  var DEG_PER_MS = 0.008;
  var dragging = null;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    size = host.clientWidth;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // leave a margin around the sphere for the raised shipping routes
    projection.scale(size / 2 * 0.86).translate([size / 2, size / 2]);
  }

  function drawPin(x, y, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-2, -5, -7, -9, -7, -14);
    ctx.arc(0, -14, 7, Math.PI, 0);
    ctx.bezierCurveTo(7, -9, 2, -5, 0, 0);
    ctx.closePath();
    ctx.fillStyle = '#D71F14';
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#FFF7EA';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -14, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF7EA';
    ctx.fill();
    ctx.restore();
  }

  function draw(t) {
    var r = projection.scale();
    var c = size / 2;
    projection.rotate([lambda, phi]);
    ctx.clearRect(0, 0, size, size);

    var shade = ctx.createRadialGradient(c - r * 0.35, c - r * 0.4, r * 0.1, c, c, r);
    shade.addColorStop(0, 'rgba(255,247,234,0.16)');
    shade.addColorStop(1, 'rgba(255,247,234,0.03)');
    ctx.beginPath();
    path({ type: 'Sphere' });
    ctx.fillStyle = shade;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,247,234,0.35)';
    ctx.stroke();

    ctx.beginPath();
    path(graticule);
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = 'rgba(255,247,234,0.09)';
    ctx.stroke();

    if (land) {
      ctx.beginPath();
      path(land);
      ctx.fillStyle = 'rgba(255,247,234,0.5)';
      ctx.fill();
    }

    var center = projection.invert([c, c]);
    drawRoutes(t, center, c);
    MARKETS.forEach(function (m, i) {
      var dist = d3.geoDistance(m.coords, center);
      if (dist > Math.PI / 2) return;
      var p = projection(m.coords);
      var fade = Math.min(1, (Math.PI / 2 - dist) / 0.35);
      var rings = i === 0 ? 3 : 1;   // the Philippines, where every route starts, pulses strongest
      for (var k = 0; k < rings; k++) {
        var pulse = (t / 1800 + i * 0.13 + k / rings) % 1;
        ctx.beginPath();
        ctx.arc(p[0], p[1], 3 + pulse * (i === 0 ? 22 : 13), 0, Math.PI * 2);
        ctx.lineWidth = i === 0 ? 2 : 1.5;
        ctx.strokeStyle = 'rgba(255,201,60,' + (0.7 * (1 - pulse) * fade) + ')';
        ctx.stroke();
      }
      drawPin(p[0], p[1], fade);
      drawLabel(m.name, p[0], p[1] + (m.dy || 0), m.side, fade);
    });
  }

  // Shipping routes: arcs lifted off the surface from the Philippines to each
  // market, each with a glowing "shipment" travelling along it.
  var ORIGIN = MARKETS[0].coords;
  var ROUTE_STEPS = 48;
  var routes = MARKETS.slice(1).map(function (m) {
    var interp = d3.geoInterpolate(ORIGIN, m.coords);
    var span = d3.geoDistance(ORIGIN, m.coords);
    var pts = [];
    for (var s = 0; s <= ROUTE_STEPS; s++) pts.push(interp(s / ROUTE_STEPS));
    return { pts: pts, lift: Math.min(0.15, 0.04 + span * 0.05) };
  });

  // Project a lon/lat point raised `h` (fraction of the radius) above the surface
  function lifted(pt, h, c, center) {
    if (d3.geoDistance(pt, center) > Math.PI / 2 + h * 0.6) return null;
    var p = projection(pt);
    return [c + (p[0] - c) * (1 + h), c + (p[1] - c) * (1 + h)];
  }

  function drawRoutes(t, center, c) {
    routes.forEach(function (route, i) {
      var n = route.pts.length - 1;
      ctx.beginPath();
      var pen = false;
      for (var s = 0; s <= n; s++) {
        var q = lifted(route.pts[s], route.lift * Math.sin(Math.PI * s / n), c, center);
        if (!q) { pen = false; continue; }
        if (pen) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]);
        pen = true;
      }
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = 'rgba(255,201,60,0.38)';
      ctx.stroke();
      ctx.setLineDash([]);

      if (!t) return;
      // the shipment: a bright dot with a short fading tail
      var head = ((t / 2600) + i * 0.137) % 1;
      for (var k = 0; k < 7; k++) {
        var f = head - k * 0.025;
        if (f < 0) break;
        var q2 = lifted(interpAt(route.pts, f), route.lift * Math.sin(Math.PI * f), c, center);
        if (!q2) continue;
        var a = (1 - k / 7) * Math.sin(Math.PI * f);
        ctx.beginPath();
        ctx.arc(q2[0], q2[1], k === 0 ? 2.6 : 2 - k * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,224,140,' + a + ')';
        if (k === 0) { ctx.shadowColor = 'rgba(255,201,60,0.9)'; ctx.shadowBlur = 10; }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
  }

  function interpAt(pts, f) {
    var x = f * (pts.length - 1), i = Math.floor(x), r = x - i;
    if (i >= pts.length - 1) return pts[pts.length - 1];
    return d3.geoInterpolate(pts[i], pts[i + 1])(r); // stays correct across the date line
  }

  function drawLabel(text, x, y, side, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '600 12px Figtree, sans-serif';
    ctx.textBaseline = 'middle';
    var w = ctx.measureText(text).width;
    if (side > 0 && x + 11 + w > size - 2) side = -1;
    else if (side < 0 && x - 11 - w < 2) side = 1;
    ctx.textAlign = side > 0 ? 'left' : 'right';
    var lx = x + side * 11;
    var ly = y - 14;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(43,14,9,0.85)';
    ctx.strokeText(text, lx, ly);
    ctx.fillStyle = '#FFF7EA';
    ctx.fillText(text, lx, ly);
    ctx.restore();
  }

  var last = null;
  function frame(t) {
    if (last !== null && !dragging && !reduceMotion) lambda += (t - last) * DEG_PER_MS;
    last = t;
    draw(reduceMotion ? 0 : t);
    requestAnimationFrame(frame);
  }

  canvas.addEventListener('pointerdown', function (e) {
    dragging = { x: e.clientX, y: e.clientY, lambda: lambda, phi: phi };
    canvas.setPointerCapture(e.pointerId);
    host.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var degPerPx = 180 / size;
    lambda = dragging.lambda + (e.clientX - dragging.x) * degPerPx;
    phi = Math.max(-75, Math.min(75, dragging.phi - (e.clientY - dragging.y) * degPerPx));
  });
  function endDrag() {
    dragging = null;
    host.classList.remove('is-dragging');
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);

  if (typeof topojson !== 'undefined') {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json')
      .then(function (res) { return res.json(); })
      .then(function (topo) {
        land = topojson.feature(topo, topo.objects.land);
      })
      .catch(function () {});
  }
})();
