import {
  circularSpeed,
  createFieldSample,
  densityAt,
  dragDeceleration,
  entryHeating,
  escapeSpeed,
  GravityField,
  innermostStableOrbit,
  integrate,
  muForSurfaceGravity,
  surfaceGravity,
  timeDilation,
} from "@/packages/physics/newtonian";

describe("physics/newtonian", () => {
  test("a point mass pulls with mu over r squared, towards itself", () => {
    const field = new GravityField();
    const sample = createFieldSample();

    field.setSources([{ x: 0, y: 0, mu: 8, radius: 0.1 }]);
    field.sample(2, 0, sample);

    expect(sample.ax).toBeCloseTo(-2, 10);
    expect(sample.ay).toBeCloseTo(0, 10);
    expect(sample.magnitude).toBeCloseTo(2, 10);
  });

  test("names the source that pulls hardest, and the pull stops growing inside a body", () => {
    const field = new GravityField();
    const sample = createFieldSample();

    field.setSources([{ x: 0, y: 0, mu: 1, radius: 0.1 }, { x: 10, y: 0, mu: 100, radius: 1 }]);
    field.sample(8, 0, sample);
    expect(sample.dominant).toBe(1);
    expect(sample.dominantDistance).toBeCloseTo(2, 10);

    field.sample(10.5, 0, sample);
    expect(sample.dominantPull).toBeCloseTo(100, 6);
  });

  test("semi-implicit Euler keeps a circular orbit bounded for many revolutions", () => {
    const mu = 1;
    const body = { x: 1, y: 0, vx: 0, vy: circularSpeed(mu, 1) };
    const field = new GravityField();
    const sample = createFieldSample();
    let nearest = Infinity;
    let farthest = 0;

    field.setSources([{ x: 0, y: 0, mu, radius: 0.01 }]);

    for (let step = 0; step < 20000; step += 1) {
      field.sample(body.x, body.y, sample);
      integrate(body, sample.ax, sample.ay, 0.005);
      nearest = Math.min(nearest, Math.hypot(body.x, body.y));
      farthest = Math.max(farthest, Math.hypot(body.x, body.y));
    }

    expect(nearest).toBeGreaterThan(0.97);
    expect(farthest).toBeLessThan(1.03);
  });

  test("orbits: escape speed is root two times circular speed, and mu reproduces a chosen surface gravity", () => {
    expect(escapeSpeed(3, 2) / circularSpeed(3, 2)).toBeCloseTo(Math.SQRT2, 10);
    expect(surfaceGravity(muForSurfaceGravity(24.79, 0.7), 0.7)).toBeCloseTo(24.79, 10);
  });

  test("clocks slow towards a black hole and stop at its horizon", () => {
    expect(timeDilation(1000, 1)).toBeCloseTo(1, 2);
    expect(timeDilation(2, 1)).toBeCloseTo(Math.SQRT2, 10);
    expect(timeDilation(1, 1)).toBe(Infinity);
  });

  test("a black hole pulls as Newton's mass does far off and ever harder near its horizon; nothing circles inside three of its radii", () => {
    const field = new GravityField();
    const sample = createFieldSample();
    const hole = { x: 0, y: 0, mu: 1, radius: 0.001, horizon: 1 };

    field.setSources([hole]);
    expect(field.sample(1000, 0, sample).magnitude).toBeCloseTo(1 / 1000 ** 2, 8);
    expect(field.sample(2, 0, sample).magnitude).toBeCloseTo(1, 10);
    expect(innermostStableOrbit(1)).toBe(3);

    // A circular orbit nudged a hundredth inward: outside the innermost stable orbit it holds; inside, it falls in.
    const orbit = (start: number) => {
      const body = { x: start * 0.99, y: 0, vx: 0, vy: Math.sqrt((hole.mu * start) / (start - hole.horizon) ** 2), prevX: 0, prevY: 0 };
      let nearest = Infinity;

      for (let step = 0; step < 200000 && Math.hypot(body.x, body.y) > hole.horizon; step += 1) {
        field.sample(body.x, body.y, sample);
        integrate(body, sample.ax, sample.ay, 0.002);
        nearest = Math.min(nearest, Math.hypot(body.x, body.y));
      }

      return nearest;
    };

    expect(orbit(4)).toBeGreaterThan(3.5);
    expect(orbit(2.6)).toBeLessThanOrEqual(1);
  });

  test("an atmosphere thins with height and ends at its top; drag and heating rise with speed", () => {
    const air = { surfaceDensity: 1.2, scaleHeight: 0.1, top: 0.5 };

    expect(densityAt(air, 0)).toBeCloseTo(1.2, 10);
    expect(densityAt(air, 0.1)).toBeCloseTo(1.2 / Math.E, 10);
    expect(densityAt(air, 0.6)).toBe(0);
    expect(dragDeceleration(1, 2, 0.5)).toBe(2);
    expect(entryHeating(1, 2, 1) / entryHeating(1, 1, 1)).toBe(8);
  });
});
