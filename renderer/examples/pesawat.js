// ===== DUNIA =====
// Kamera: pesawat utuh tiga perempat -> sisi kabin terbuka -> jalur udara.
// Model skematis pesawat bermesin jet dengan sistem bleed air.
// Sumbu: x menuju ekor, y menuju sayap, z ke atas.
// Seluruh geometri dan gerakan dihitung ulang dari waktu.

const TAU = Math.PI * 2;
const C = {
  shell: "#e8eef3",
  edge: "#879aaf",
  blue: "#3269bd",
  glass: "#24435e",
  metal: "#a8b9c9",
  dark: "#293c50",
  floor: "#aab8c4",
  seat: "#48718d",
  air: "#42b8ed",
  fresh: "#31bdac",
  hot: "#ed9657",
  ink: "#24364b",
  muted: "#6e8195",
  white: "#ffffff"
};
const flat = { wobble: 0, hatch: false };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = v => {
  const k = clamp(v);
  return k * k * (3 - 2 * k);
};
const mixHex = (a, b, k) => {
  const u = clamp(k);
  return "#" + [1, 3, 5].map(i => {
    const aa = parseInt(a.slice(i, i + 2), 16);
    const bb = parseInt(b.slice(i, i + 2), 16);
    return Math.round(lerp(aa, bb, u)).toString(16).padStart(2, "0");
  }).join("");
};
const shade = (color, v) =>
  v <= 1 ? mixHex("#000000", color, v) : mixHex(color, "#ffffff", v - 1);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((n, v, i) => n + v * b[i], 0);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
const unit = a => {
  const n = Math.hypot(...a) || 1;
  return a.map(v => v / n);
};
const springAt = (start, end) => {
  const u = clamp((s.t - start) / Math.max(0.001, end - start));
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  return lerp(
    clamp(s.spring(start, "smooth")),
    1,
    smooth((u - 0.72) / 0.28)
  );
};

let faces = [];
let activeCam = null;

const view = (p, cam) => {
  const c = Math.cos(cam.yaw), sn = Math.sin(cam.yaw);
  const x = p[0] * c - p[1] * sn;
  const y = p[0] * sn + p[1] * c;
  return [
    x,
    -p[2] * Math.cos(cam.pitch) - y * Math.sin(cam.pitch),
    y * Math.cos(cam.pitch) - p[2] * Math.sin(cam.pitch)
  ];
};
const P = (p, cam = activeCam) => {
  const q = view(p, cam);
  const target = view(cam.target, cam);
  return [
    360 + (q[0] - target[0]) * cam.zoom,
    463 + (q[1] - target[1]) * cam.zoom
  ];
};
const quad = (points, fill, opt = {}) => {
  const center = points.reduce(
    (a, p) => a.map((v, i) => v + p[i] / points.length),
    [0, 0, 0]
  );
  faces.push({
    points,
    fill,
    alpha: opt.alpha ?? 1,
    stroke: opt.stroke ?? null,
    width: opt.width ?? 0.6,
    depth: view(center, activeCam)[2] + (opt.bias ?? 0)
  });
};
const surface = (points, color, opt = {}) => {
  const n = unit(cross(sub(points[1], points[0]), sub(points[2], points[0])));
  const light = unit([-0.45, -0.6, 0.9]);
  const strength = 0.78 + 0.28 * Math.abs(dot(n, light));
  quad(points, shade(color, strength), opt);
};
const box = (a, b, color, opt = {}) => {
  const p = Array.from({ length: 8 }, (_, i) => [
    i & 1 ? b[0] : a[0],
    i & 2 ? b[1] : a[1],
    i & 4 ? b[2] : a[2]
  ]);
  for (const ids of [
    [0, 2, 3, 1], [4, 5, 7, 6], [0, 1, 5, 4],
    [2, 6, 7, 3], [0, 4, 6, 2], [1, 3, 7, 5]
  ]) surface(ids.map(i => p[i]), color, opt);
};
const ring = (center, radius, axis = "x", count = 28) =>
  Array.from({ length: count }, (_, i) => {
    const a = i * TAU / count;
    if (axis === "x") return [
      center[0], center[1] + Math.cos(a) * radius,
      center[2] + Math.sin(a) * radius
    ];
    return [
      center[0] + Math.cos(a) * radius,
      center[1] + Math.sin(a) * radius, center[2]
    ];
  });
const pipe = (points, radius, color, opt = {}) => {
  for (let j = 0; j < points.length - 1; j++) {
    const a = points[j], b = points[j + 1];
    const axis = unit(sub(b, a));
    const u = unit(cross(axis, Math.abs(axis[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0]));
    const v = cross(axis, u);
    const at = (p, angle) => p.map((x, i) =>
      x + radius * (u[i] * Math.cos(angle) + v[i] * Math.sin(angle))
    );
    for (let k = 0; k < 8; k++) {
      const t0 = k * TAU / 8, t1 = (k + 1) * TAU / 8;
      surface([at(a, t0), at(b, t0), at(b, t1), at(a, t1)], color, opt);
    }
  }
};
const bead = (p, r, color, alpha = 1) => {
  faces.push({
    point: p, r, fill: color, alpha,
    depth: view(p, activeCam)[2] - 0.3
  });
};
const onPath = (path, f) => {
  const lengths = path.slice(1).map((p, i) => Math.hypot(...sub(p, path[i])));
  let d = clamp(f) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (d <= lengths[i] || i === lengths.length - 1) {
      const k = clamp(d / (lengths[i] || 1));
      return path[i].map((v, j) => lerp(v, path[i + 1][j], k));
    }
    d -= lengths[i];
  }
  return path[0];
};
const stream = (path, count, age, speed, color, alpha) => {
  if (alpha < 0.001) return;
  for (let i = 0; i < count; i++) {
    const f = ((age * speed + i / count) % 1 + 1) % 1;
    bead(onPath(path, f), 2, color,
      alpha * Math.min(1, f * 14, (1 - f) * 14));
  }
};
const flush = () => {
  faces.sort((a, b) => b.depth - a.depth);
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const f of faces) {
    if (f.alpha <= 0.001) continue;
    ctx.globalAlpha = clamp(f.alpha);
    ctx.fillStyle = f.fill;
    ctx.beginPath();
    if (f.point) {
      const p = P(f.point);
      ctx.arc(p[0], p[1], Math.max(0.8, f.r * activeCam.zoom), 0, TAU);
    } else {
      f.points.forEach((p, i) => {
        const q = P(p);
        if (i === 0) ctx.moveTo(q[0], q[1]);
        else ctx.lineTo(q[0], q[1]);
      });
      ctx.closePath();
    }
    ctx.fill();
    if (f.stroke) {
      ctx.strokeStyle = f.stroke;
      ctx.lineWidth = f.width;
      ctx.stroke();
    }
  }
  ctx.restore();
};

const CAM_START = {
  target: [0, 0, 30], yaw: -0.49, pitch: 0.55, zoom: 0.94
};
const CAM_ORBIT = {
  target: [0, 0, 30], yaw: -0.36, pitch: 0.51, zoom: 0.98
};
const CAM_OPEN = {
  target: [-7, -3, 48], yaw: -0.22, pitch: 0.46, zoom: 1.12
};
const CAM_FLOW = {
  target: [-12, -10, 48], yaw: -0.14, pitch: 0.43, zoom: 1.22
};
const cameraMove = (a, b, start, end) => {
  const k = springAt(start, end);
  return {
    target: a.target.map((v, i) => lerp(v, b.target[i], k)),
    yaw: lerp(a.yaw, b.yaw, k),
    pitch: lerp(a.pitch, b.pitch, k),
    zoom: lerp(a.zoom, b.zoom, k)
  };
};

const BODY = [
  [-258, 2, 47], [-244, 20, 48], [-221, 39, 49],
  [-191, 49, 50], [141, 49, 50], [177, 41, 51],
  [211, 26, 53], [240, 9, 57], [252, 2, 59]
];
const bodyAt = x => {
  for (let i = 0; i < BODY.length - 1; i++) {
    if (x <= BODY[i + 1][0]) {
      const k = clamp((x - BODY[i][0]) / (BODY[i + 1][0] - BODY[i][0]));
      return [
        lerp(BODY[i][1], BODY[i + 1][1], k),
        lerp(BODY[i][2], BODY[i + 1][2], k)
      ];
    }
  }
  return [2, 59];
};
const hullPoint = (x, a, extra = 0) => {
  const [r, z] = bodyAt(x);
  return [x, Math.cos(a) * (r + extra), z + Math.sin(a) * (r + extra)];
};
const cutStart = Math.PI / 3;
const cutEnd = Math.PI * 7 / 6;
const isCut = (x, a) => x >= -171 && x <= 135 && a >= cutStart && a < cutEnd;

// Conduites schématiques, placées au bord visible de la coupe.
const FEED = [
  [-74, -88, -8], [-74, -54, -8], [-96, -39, 10],
  [-137, -39, 10], [-137, -40, 42], [-137, -34, 74]
];
const CABIN = [
  [-137, -34, 74], [-114, -30, 79], [-53, -30, 80],
  [12, -30, 79], [76, -30, 75], [112, -30, 55],
  [120, -34, 29]
];
const OUTLET = [
  [120, -34, 29], [142, -39, 20],
  [158, -52, 12], [183, -69, 4]
];

const wing = side => {
  const rootFront = [-82, side * 32, 18];
  const rootBack = [69, side * 32, 18];
  const tipFront = [69, side * 204, 11];
  const tipBack = [112, side * 204, 11];
  const segments = 14;
  for (let i = 0; i < segments; i++) {
    const a = i / segments, b = (i + 1) / segments;
    const at = (p, q, k, dz = 0) => p.map((v, j) => lerp(v, q[j], k) + (j === 2 ? dz : 0));
    surface([
      at(rootFront, tipFront, a), at(rootBack, tipBack, a),
      at(rootBack, tipBack, b), at(rootFront, tipFront, b)
    ], "#d6e0e9");
    surface([
      at(rootFront, tipFront, a, -4), at(rootFront, tipFront, b, -4),
      at(rootFront, tipFront, b), at(rootFront, tipFront, a)
    ], "#91a6b9");
    surface([
      at(rootBack, tipBack, a), at(rootBack, tipBack, b),
      at(rootBack, tipBack, b, -3), at(rootBack, tipBack, a, -3)
    ], "#91a6b9");
  }
  pipe([[20, side * 115, 15.5], [83, side * 190, 12]], 0.5, "#92a5b6");
};

const engine = (side, age) => {
  const y = side * 88, z = -13;
  // Le pylône pénètre dans l'aile et dans la nacelle.
  box([-78, y - 5, z + 12], [-39, y + 5, 20], "#a8bacb");
  const profile = [
    [-111, 19], [-104, 23], [-86, 24],
    [-64, 23], [-43, 20], [-25, 14]
  ];
  for (let j = 0; j < profile.length - 1; j++) {
    for (let i = 0; i < 28; i++) {
      const a = i * TAU / 28, b = (i + 1) * TAU / 28;
      const pt = (row, angle) => [
        row[0], y + Math.cos(angle) * row[1], z + Math.sin(angle) * row[1]
      ];
      surface([
        pt(profile[j], a), pt(profile[j + 1], a),
        pt(profile[j + 1], b), pt(profile[j], b)
      ], "#c9d7e2");
    }
  }
  // Lèvre annulaire : centre ouvert, fan situé derrière.
  for (let i = 0; i < 28; i++) {
    const a = i * TAU / 28, b = (i + 1) * TAU / 28;
    quad([
      [-111.2, y + Math.cos(a) * 19, z + Math.sin(a) * 19],
      [-111.2, y + Math.cos(b) * 19, z + Math.sin(b) * 19],
      [-111.2, y + Math.cos(b) * 16, z + Math.sin(b) * 16],
      [-111.2, y + Math.cos(a) * 16, z + Math.sin(a) * 16]
    ], "#edf4f8");
  }
  quad(ring([-110.8, y, z], 16), "#203448");
  for (let i = 0; i < 12; i++) {
    const a = age * 1.6 + i * TAU / 12;
    const pt = (r, angle) => [-111, y + Math.cos(angle) * r, z + Math.sin(angle) * r];
    quad([pt(4, a), pt(14.8, a + 0.17), pt(14.8, a + 0.34), pt(4, a + 0.42)],
      "#829bac");
  }
  quad(ring([-111.3, y, z], 4), "#d5e2eb");
  quad(ring([-24.8, y, z], 11), "#33495c");
};

const tail = () => {
  for (const side of [-1, 1]) {
    surface([
      [161, side * 14, 58], [213, side * 99, 49],
      [240, side * 99, 49], [224, side * 8, 58]
    ], "#b9ccdc");
    surface([
      [213, side * 99, 49], [240, side * 99, 49],
      [240, side * 99, 46], [213, side * 99, 46]
    ], "#8aa2b7");
  }
  const left = [[150, -3, 81], [204, -3, 166], [229, -3, 166], [226, -3, 75]];
  const right = left.map(p => [p[0], 3, p[2]]);
  surface(left, C.blue);
  surface(right, "#407bc4");
  for (let i = 0; i < 4; i++) {
    const n = (i + 1) % 4;
    surface([left[i], right[i], right[n], left[n]], "#8da8c2");
  }
  quad([[185, -3.2, 112], [206, -3.2, 149], [216, -3.2, 149], [195, -3.2, 112]],
    "#d7e8f5");
};

const interior = st => {
  // Petites surfaces pour conserver une occultation correcte.
  for (let x = -171; x < 135; x += 18) {
    box([x, -40, 17], [Math.min(x + 18, 135), 40, 20], C.floor);
    quad([[x, -8, 20.2], [Math.min(x + 18, 135), -8, 20.2],
      [Math.min(x + 18, 135), 8, 20.2], [x, 8, 20.2]], "#6f8396");
  }
  for (let row = 0; row < 7; row++) {
    const x = -140 + row * 38;
    for (const y of [-25, 25]) {
      box([x - 7, y - 8, 20], [x - 4, y + 8, 31], "#73889b");
      box([x + 6, y - 8, 20], [x + 9, y + 8, 31], "#73889b");
      box([x - 10, y - 11, 30], [x + 10, y + 11, 35], C.seat);
      box([x + 6, y - 11, 35], [x + 11, y + 11, 61], "#3d617c");
      box([x + 5.5, y - 8, 53], [x + 11.5, y + 8, 62], "#7595ad");
    }
  }
  if (st.open > 0.001) {
    // Les nervures restent fixées au fuselage.
    for (const x of [-171, 135]) {
      for (let i = 0; i < 48; i++) {
        const a = i * TAU / 48, b = (i + 1) * TAU / 48;
        if (a >= cutStart && a < cutEnd) continue;
        quad([hullPoint(x, a, -1), hullPoint(x + 2, a, -1),
          hullPoint(x + 2, b, -1), hullPoint(x, b, -1)], "#90a6ba");
      }
    }
    for (const angle of [cutStart, cutEnd]) {
      const line = [];
      for (let x = -171; x <= 135; x += 18) line.push(hullPoint(x, angle, -0.8));
      pipe(line, 1.1, "#7893aa");
    }
  }
  const visible = st.open * st.flow;
  if (visible > 0.001) {
    pipe(FEED, 2.8, "#7195a9", { alpha: visible });
    box([-116, -44, 5], [-92, -29, 16], "#5b8098", { alpha: visible });
    for (let i = 0; i < 6; i++) {
      box([-114 + i * 3.5, -44.3, 6], [-112.6 + i * 3.5, -29, 15],
        "#bddae7", { alpha: visible });
    }
    stream(FEED, 13, st.age, 0.16, C.air, visible);
    stream(CABIN, 24, st.age, 0.10, C.fresh, visible);
  }
  const exhaust = st.open * st.out;
  if (exhaust > 0.001) {
    pipe(OUTLET.slice(0, 3), 2.7, "#7895aa", { alpha: exhaust });
    const v = [147, -43, 17];
    quad(ring(v, 7, "z"), "#435d74", { alpha: exhaust });
    const a = lerp(0.12, 0.85, st.out);
    const disk = ring([0, 0, 0], 5.8, "z").map(p => [
      v[0] + p[0], v[1] + p[1] * Math.cos(a),
      v[2] + p[1] * Math.sin(a) + 0.3
    ]);
    quad(disk, "#d4e2eb", { alpha: exhaust });
    pipe([[v[0] - 8, v[1], v[2] + 0.4], [v[0] + 8, v[1], v[2] + 0.4]],
      0.8, C.dark, { alpha: exhaust });
    stream(OUTLET, 8, st.age, 0.20, C.air, exhaust);
  }
};

const hull = st => {
  const xs = [-258, -250, -244, -232, -221, -206, -191, -180, -171];
  for (let x = -153; x < 135; x += 18) xs.push(x);
  xs.push(135, 141, 159, 177, 194, 211, 226, 240, 252);
  for (let j = 0; j < xs.length - 1; j++) {
    const x0 = xs[j], x1 = xs[j + 1], mid = (x0 + x1) / 2;
    for (let i = 0; i < 48; i++) {
      const a = i * TAU / 48, b = (i + 1) * TAU / 48;
      const cut = isCut(mid, a + 0.001);
      const alpha = cut ? 1 - st.open : 1;
      if (alpha <= 0.001) continue;
      const stripe = i === 22 || i === 23;
      const base = stripe ? "#47769f" : C.shell;
      const light = 0.79 + 0.23 * Math.max(0, Math.sin(a)) +
        0.035 * Math.max(0, -Math.cos(a));
      quad([
        hullPoint(x0, a), hullPoint(x1, a),
        hullPoint(x1, b), hullPoint(x0, b)
      ], shade(base, light), { alpha });
    }
  }

  for (const side of [-1, 1]) {
    for (let i = 0; i < 10; i++) {
      const x = -133 + i * 26;
      const opacity = side < 0 ? 1 - st.open : 1;
      if (opacity <= 0.001) continue;
      const points = Array.from({ length: 20 }, (_, k) => {
        const a = k * TAU / 20;
        const z = 65 + Math.sin(a) * 6;
        return [x + Math.cos(a) * 3.8,
          side * Math.sqrt(49.6 ** 2 - (z - 50) ** 2), z];
      });
      quad(points, C.glass, {
        alpha: opacity, stroke: "#f2f6fa", width: 0.9
      });
    }
  }
  const door = [[-165, 29], [-147, 29], [-147, 77], [-165, 77]]
    .map(([x, z]) => [x, -Math.sqrt(49.6 ** 2 - (z - 50) ** 2), z]);
  quad(door, "#dae4ec", {
    alpha: 1 - st.open, stroke: "#8b9eaf", width: 0.9
  });

  for (const side of [-1, 1]) {
    quad([
      hullPoint(-237, side < 0 ? 2.48 : 0.66, 0.7),
      hullPoint(-219, side < 0 ? 2.48 : 0.66, 0.7),
      hullPoint(-212, side < 0 ? 2.06 : 1.08, 0.7),
      hullPoint(-229, side < 0 ? 2.06 : 1.08, 0.7)
    ], C.glass, { stroke: "#dce7ef", width: 1 });
  }
};

const world = (cam, st) => {
  activeCam = cam;
  faces = [];
  wing(1);
  wing(-1);
  engine(1, st.age);
  engine(-1, st.age);
  tail();
  interior(st);
  hull(st);
  flush();
};

const heading = () => {
  s.text("CARA KERJA", 94, 67, {
    size: 13, color: C.muted, align: "left"
  });
  s.text3d("Udara tipis,", 94, 107, {
    size: 34, depth: 0, color: C.ink, align: "left"
  });
  s.rect(88, 130, 280, 46, {
    r: 9, fill: C.blue, stroke: "none", ...flat
  });
  s.text3d("kabin tetap nyaman", 101, 153, {
    size: 26, depth: 0, color: C.white, align: "left"
  });
};
const gauge = thin => {
  const x = 580, y = 108, r = 33;
  s.circle(x, y, 44, { fill: "#f6f9fc", stroke: "none", ...flat });
  s.arc(x, y, r, Math.PI * 0.75, Math.PI * 2.25, {
    stroke: "#dae3ec", width: 5, ...flat
  });
  s.arc(x, y, r, Math.PI * 0.75,
    Math.PI * 0.75 + Math.PI * 1.5 * lerp(0.9, 0.3, thin), {
      stroke: C.blue, width: 5, ...flat
    });
  s.text("UDARA", x, y - 5, { size: 10, color: C.muted, align: "center" });
  s.text("LUAR", x, y + 12, { size: 12, color: C.ink, align: "center" });
  s.text(thin > 0.8 ? "LEBIH TIPIS" : "TEKANAN", x, 165, {
    size: 10, color: C.muted, align: "center"
  });
};
const callout = (cam, p, text, x, y, alpha = 1, color = C.blue) => {
  if (alpha <= 0.001) return;
  const q = P(p, cam);
  ctx.save();
  ctx.font = '700 13px "Segoe UI", sans-serif';
  const width = ctx.measureText(text).width + 24;
  ctx.restore();
  s.polyline([[q[0], q[1]], [x, y + 23], [x, y + 12]], {
    stroke: color, width: 1.2, alpha, ...flat
  });
  s.circle(q[0], q[1], 3, {
    fill: color, stroke: "#ffffff", width: 1, alpha, ...flat
  });
  s.rect(x - width / 2, y - 14, width, 28, {
    r: 7, fill: "#f7fafc", stroke: "#dce5ed", width: 1, alpha, ...flat
  });
  s.text(text, x, y + 1, {
    size: 13, color: C.ink, align: "center", alpha
  });
};
const caption = (text, alpha = 1) => {
  s.text(text, 360, 708, {
    size: 12, color: C.muted, align: "center", alpha
  });
};

// ===== AKHIR DUNIA =====

// ===== SCENE 12 =====
// kamera: CAM_VALVE_CONTROL -> CAM_RELEASE
const CAM_VALVE_CONTROL = {
  target: [139, -42, 30], yaw: -0.18, pitch: 0.60, zoom: 4.60
};
const CAM_RELEASE = {
  target: [150, -49, 29], yaw: -0.06, pitch: 0.62, zoom: 4.15
};
const cam = cameraMove(CAM_VALVE_CONTROL, CAM_RELEASE, 0.10, 2.74);
const age = 43.19 + s.t;
const openK = springAt(2.00, 2.74);
const response = springAt(2.25, 2.90);
const opening = lerp(0.15, 0.80, openK);
const pressure = lerp(0.86, 0.80, response);
const valveAngle = Math.acos(1 - opening);
const uiChange = springAt(0.80, 1.45);

ctx.save();
ctx.scale(0, 0);
world(cam, { age, open: 1, flow: 1, out: 1 });
ctx.restore();
faces = faces.filter(f => {
  if (!f.points || f.points.length !== 4) return true;
  const p = f.points;
  const panel = p.every(q =>
    q[0] >= -111 && q[0] <= -25 && q[1] >= -113 && q[1] <= -63 &&
    q[2] >= -38 && q[2] <= 12 && Math.hypot(q[1] + 88, q[2] + 13) >= 13.9);
  const span = Math.max(...p.map(q => q[0])) - Math.min(...p.map(q => q[0]));
  return !(panel && span >= 1 &&
    p.reduce((v, q) => v + q[1] / 4, 0) <= -83 &&
    p.reduce((v, q) => v + q[2] / 4, 0) >= -23);
});
pipe([[-106, -88, -13], [-35, -88, -13]], 2.3, "#7c93a7");
for (let j = 0; j < 6; j++) {
  const x = -102 + j * 6, r = 13.2 - j * 0.72;
  quad(ring([x, -88, -13], 3.7), "#b6c9d8");
  for (let i = 0; i < 14; i++) {
    const a = age * 1.6 + j * 0.19 + i * TAU / 14;
    const pt = (rr, b, dx = 0) =>
      [x + dx, -88 + Math.cos(b) * rr, -13 + Math.sin(b) * rr];
    surface([pt(3.5, a), pt(r, a + 0.16, 1.2),
      pt(r, a + 0.31, 1.2), pt(3.5, a + 0.34)], mixHex("#b9cedc", "#e6a06b", j / 12));
  }
}
for (let j = 0; j < 5; j++) {
  for (let i = 0; i < 24; i++) {
    const x = -65 + j * 5, a = i * TAU / 24, b = (i + 1) * TAU / 24;
    const pt = (xx, angle) =>
      [xx, -88 + Math.cos(angle) * 9, -13 + Math.sin(angle) * 9];
    surface([pt(x, a), pt(x + 5, a), pt(x + 5, b), pt(x, b)], "#34495a");
  }
}
for (let i = 0; i < 12; i++) {
  const a = i * TAU / 12;
  bead([-62, -88 + Math.cos(a) * 9.2, -13 + Math.sin(a) * 9.2], 0.65, "#91a7b9");
}
const bleed = [[-70, -88, -5], [-70, -103, -5], [-74, -106, -5],
  [-74, -106, -8], [-74, -88, -8]];
const hotPath = [[-74, -88, -8], [-74, -54, -8], [-96, -39, 10], [-104, -39, 10]];
const coldPath = [[-104, -39, 10], [-137, -39, 10], [-137, -40, 42], [-137, -34, 74]];
pipe(bleed, 1.65, "#ff7a45");
stream(bleed, 7, age, 0.18, "#ffb777", 1);
pipe(hotPath, 2.9, "#d08850");
stream(hotPath, 11, age, 0.16, "#ff9859", 1);
for (let i = 0; i < 6; i++) {
  box([-114 + i * 3.5, -44.5, 6], [-112.6 + i * 3.5, -29, 15], "#82d5dd");
}
pipe(coldPath, 2.95, "#31bdac");
stream(coldPath, 13, age, 0.16, "#c1fff1", 1);
stream(CABIN, 24, age, 0.10, "#31bdac", 1);

faces = faces.map(f => {
  if (f.point && f.fill === C.air && f.point[0] >= 120) {
    return { ...f, alpha: f.alpha * lerp(0.24, 1, openK) };
  }
  if (!f.points || f.points.length !== 28 || f.fill !== "#d4e2eb") return f;
  const points = ring([0, 0, 0], 5.8, "z").map(p => [
    147 + p[0], -43 + p[1] * Math.cos(valveAngle),
    17.3 + p[1] * Math.sin(valveAngle)
  ]);
  return { ...f, points, depth: view([147, -43, 17.3], cam)[2] };
});

const dialPoint = (r, a, y = -37.2) =>
  [112 + Math.cos(a) * r, y, 69 + Math.sin(a) * r];
box([109, -35, 20], [115, -31, 56], "#849caf");
pipe([[112, -33, 54], [112, -33, 69]], 2.2, "#849caf");
for (let i = 0; i < 48; i++) {
  const a = i * TAU / 48, b = (i + 1) * TAU / 48;
  surface([dialPoint(15, a, -35), dialPoint(15, b, -35),
    dialPoint(15, b, -38), dialPoint(15, a, -38)], "#aeb8c6");
}
quad(Array.from({ length: 48 }, (_, i) => dialPoint(14, i * TAU / 48, -38.1)), "#f8fafc");
const needleAngle = v => lerp(Math.PI * 1.18, -Math.PI * 0.18, clamp((v - 0.50) / 0.50));
const greenA = needleAngle(0.74), greenB = needleAngle(0.90);
for (let i = 0; i < 16; i++) {
  const a = lerp(greenA, greenB, i / 16), b = lerp(greenA, greenB, (i + 1) / 16);
  quad([dialPoint(10.3, a, -38.3), dialPoint(12.6, a, -38.3),
    dialPoint(12.6, b, -38.3), dialPoint(10.3, b, -38.3)], "#a7dfc9");
}
for (let i = 0; i <= 10; i++) {
  const a = needleAngle(0.50 + i * 0.05);
  pipe([dialPoint(11.1, a, -38.4), dialPoint(12.8, a, -38.4)], 0.24, "#73869b");
}
pipe([[112, -38.7, 69], dialPoint(10.3, needleAngle(pressure), -38.7)], 0.65, "#3b5bdb");
bead([112, -39, 69], 1.35, "#24364b");

for (let i = 0; i < 42; i++) {
  const p = [60 + s.rand(600 + i * 3) * 67,
    -39 + s.rand(601 + i * 3) * 19,
    39 + s.rand(602 + i * 3) * 41];
  p[0] += Math.sin(age * 0.70 + i) * 1.2;
  p[2] += Math.cos(age * 0.55 + i * 1.7) * 0.7;
  bead(p, 0.85, "#31bdac", clamp((38 - response * 14 - i) / 4) * 0.48);
}

// Garis angin mengikuti jalur keluar yang sama, bukan menembus badan.
for (let lane = 0; lane < 4; lane++) {
  const spread = (lane - 1.5) * 1.25;
  const path = [
    [158, -52 + spread * 0.25, 12],
    [169, -59 + spread, 8 + spread * 0.3],
    [183, -69 + spread * 1.8, 4 + spread * 0.6],
    [196, -79 + spread * 2.3, -1 + spread * 0.8]
  ];
  for (let j = 0; j < 3; j++) {
    const f = ((age * 0.42 + j / 3 + lane * 0.08) % 1 + 1) % 1;
    const tailF = Math.max(0, f - 0.12);
    pipe([onPath(path, tailF), onPath(path, f)], 0.40,
      "#4dabf7", {
        alpha: openK * Math.min(1, f * 8, (1 - f) * 8) * 0.75
      });
  }
}
flush();

callout(cam, [147, -43, 17], "BUKAAN DIPERKECIL", 461, 627,
  1 - uiChange, "#3b5bdb");
const labelIn = springAt(2.00, 2.60);
callout(cam, [147, -43, 17], "BUKAAN DIPERBESAR", 457,
  627 + (1 - labelIn) * 16, labelIn, "#3b5bdb");

const title12 = (second, width, alpha, dy) => {
  s.group({ y: dy, alpha }, () => {
    s.text("03 / 05", 96, 66, { size: 16, color: "#24364b", align: "left" });
    s.line(172, 66, 214, 66, { stroke: "#879aaf", width: 1.4, ...flat });
    ctx.save();
    ctx.shadowColor = "#eef2f7";
    ctx.shadowBlur = 22;
    s.text3d("Lebih banyak", 96, 105, {
      size: 38, depth: 0, color: "#1c2433", align: "left"
    });
    ctx.restore();
    s.rect(90, 127, width, 46, {
      r: 10, fill: "#3b5bdb", stroke: "#ffffff", width: 3, ...flat
    });
    s.text3d(second, 103, 150, { size: 29, depth: 0, color: "#ffffff", align: "left" });
  });
};
title12("ditahan", 190, 1 - uiChange, -10 * uiChange);
title12("dilepas", 190, uiChange, 14 * (1 - uiChange));

s.circle(580, 104, 44, { fill: "#ffffff", stroke: "none", ...flat });
s.arc(580, 104, 34, Math.PI * 0.75, Math.PI * 2.25, {
  stroke: "#dbe2eb", width: 5, ...flat
});
s.arc(580, 104, 34, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * opening, {
  stroke: "#3b5bdb", width: 5, ...flat
});
s.text3d(String(Math.round(opening * 100)), 580, 102, {
  size: 26, depth: 0, color: "#1c2433"
});
s.text("% terbuka", 580, 123, { size: 11, color: "#6b7685", align: "center" });
s.rect(538, 154, 84, 25, { r: 12, fill: "#ffffff", stroke: "none", ...flat });
s.circle(550, 166, 3, { fill: "#3b5bdb", stroke: "none", ...flat });
s.text("BEKERJA", 585, 167, { size: 10, color: "#24364b", align: "center" });
s.text("ILUSTRASI", 580, 193, { size: 10, color: "#6b7685", align: "center" });

const stickerIn = clamp(s.spring(2.40, "smooth"));
const stickerOut = 1 - smooth((s.t - 2.78) / 0.36);
s.group({
  x: 493,
  y: 704 + (1 - stickerIn) * 18,
  scale: lerp(0.86, 1, stickerIn),
  alpha: stickerIn * stickerOut
}, () => {
  s.text3d("WUUSH!", 0, 0, {
    size: 30, depth: 3, color: "#4dabf7",
    side: "#ffffff", rotate: -0.08
  });
});
s.sfx("click", 2.00, 0.10, 0.85);
s.sfx("swish", 2.40, 0.17, 0.80);
