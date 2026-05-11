import { calculate, defaultInputs } from "../src/calc/beamCell/engine";

function fmt(n: number | undefined): string {
  return n === undefined ? "—" : n.toFixed(4);
}

const cases: Array<{
  label: string;
  inputs: Parameters<typeof calculate>[0];
  expect: Partial<{
    mainC245Profile: string;
    mainC245WeightKg: number;
    mainC245CostRub: number;
    mainC345Profile: string;
    mainC345WeightKg: number;
    mainC345CostRub: number;
    secondaryStatus: string;
    columnStatus: string;
  }>;
}> = [
  {
    label: "Default (балка покрытия, span=6, step=6, load=145)",
    inputs: defaultInputs,
    expect: {
      mainC245Profile: "25 Б2",
      mainC245WeightKg: 355.2012,
      mainC245CostRub: 68624.6412,
      mainC345Profile: "25 Б1",
      mainC345WeightKg: 308.4098,
      mainC345CostRub: 62774.8298,
      secondaryStatus: "NO_SOLUTION",
      columnStatus: "NO_SOLUTION",
    },
  },
  {
    label: "Complete solution: монолитный ЖБ 150мм, C345 for all",
    inputs: {
      ...defaultInputs,
      floorType: "монолитный ЖБ 150мм",
      acceptedSecondarySteel: "C345",
      acceptedMainSteel: "C345",
      acceptedColumnSteel: "C345",
    },
    expect: {
      // Per VELICAN test — full solution should exist
    },
  },
];

const TOL = 0.001;
let pass = 0;
let fail = 0;
const fails: string[] = [];

for (const c of cases) {
  const r = calculate(c.inputs);
  console.log(`\n=== ${c.label} ===`);
  console.log(`qMain = ${fmt(r.qMain)} кН/м²`);
  console.log(
    `secondary C245: ${r.secondary.C245.status} ${r.secondary.C245.profile ?? "-"} ${fmt(r.secondary.C245.weightKg)}`,
  );
  console.log(
    `secondary C345: ${r.secondary.C345.status} ${r.secondary.C345.profile ?? "-"} ${fmt(r.secondary.C345.weightKg)}`,
  );
  console.log(
    `main C245: ${r.main.C245.status} ${r.main.C245.profile} weight=${fmt(r.main.C245.weightKg)} cost=${fmt(r.main.C245.costRub)}`,
  );
  console.log(
    `main C345: ${r.main.C345.status} ${r.main.C345.profile} weight=${fmt(r.main.C345.weightKg)} cost=${fmt(r.main.C345.costRub)}`,
  );
  console.log(
    `columns C245: ${r.columns.C245.status} ${r.columns.C245.profile ?? "-"}`,
  );
  console.log(
    `columns C345: ${r.columns.C345.status} ${r.columns.C345.profile ?? "-"}`,
  );

  function check(name: string, got: unknown, want: unknown) {
    let ok: boolean;
    if (typeof want === "number" && typeof got === "number") {
      ok = Math.abs(got - want) / Math.max(1, Math.abs(want)) < TOL;
    } else {
      ok = got === want;
    }
    if (ok) {
      pass++;
    } else {
      fail++;
      const msg = `  FAIL ${name}: got=${String(got)} want=${String(want)}`;
      console.log(msg);
      fails.push(`[${c.label}] ${msg}`);
    }
  }

  if (c.expect.mainC245Profile !== undefined)
    check("main.C245.profile", r.main.C245.profile, c.expect.mainC245Profile);
  if (c.expect.mainC245WeightKg !== undefined)
    check("main.C245.weightKg", r.main.C245.weightKg, c.expect.mainC245WeightKg);
  if (c.expect.mainC245CostRub !== undefined)
    check("main.C245.costRub", r.main.C245.costRub, c.expect.mainC245CostRub);
  if (c.expect.mainC345Profile !== undefined)
    check("main.C345.profile", r.main.C345.profile, c.expect.mainC345Profile);
  if (c.expect.mainC345WeightKg !== undefined)
    check("main.C345.weightKg", r.main.C345.weightKg, c.expect.mainC345WeightKg);
  if (c.expect.mainC345CostRub !== undefined)
    check("main.C345.costRub", r.main.C345.costRub, c.expect.mainC345CostRub);
  if (c.expect.secondaryStatus !== undefined) {
    check("secondary.C245.status", r.secondary.C245.status, c.expect.secondaryStatus);
    check("secondary.C345.status", r.secondary.C345.status, c.expect.secondaryStatus);
  }
  if (c.expect.columnStatus !== undefined) {
    check("columns.C245.status", r.columns.C245.status, c.expect.columnStatus);
    check("columns.C345.status", r.columns.C345.status, c.expect.columnStatus);
  }
}

console.log(`\n=== Summary: ${pass}/${pass + fail} PASS ===`);
if (fail > 0) {
  console.log("\nFails:");
  fails.forEach((f) => console.log(f));
  process.exit(1);
}
