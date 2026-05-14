#!/usr/bin/env python3
"""
Freeze ground-truth N/M/snow/wind values for the 10 column scenarios as a
JSON fixture for the TypeScript acceptance test.

Source of truth: scripts/verify_baseline.py (the validated Python
re-implementation of the Excel formulas; per knowledge/log.md, it matches
Excel on N and M with 0.00% deviation across all 10 scenarios).

The fixture is consumed by src/calc/engine.acceptance.test.ts.

Usage (from repo root):
    py scripts/freeze_column_fixtures.py

Re-run only when the Python oracle or the scenario list intentionally
changes. Engine code MUST NOT be edited to make the fixture pass — instead
update both the Python oracle and the fixture deliberately.
"""
from __future__ import annotations

import json
import os
import sys

HERE = os.path.dirname(__file__)
sys.path.insert(0, HERE)

from verify_baseline import calc  # noqa: E402

# Same 10 scenarios as scripts/excel_oracle.py, expressed in the engine's
# vocabulary (English) directly so the JSON file is consumed verbatim by TS.
SCENARIOS = [
    {
        "id": "SCN-COL-DEFAULT",
        "label": "Excel default scenario (фахверковая, w0=0.6, sg=1.7)",
        "input": dict(
            span=40, length=80, h=11.5, slope=6,
            frame_pitch=6, fachverk_pitch=6,
            spans="one", ties=False, terrain="B",
            col_type="fachwerk",
            w0=0.6, sg=1.7, gamma_n=1.0, addition=15,
            roof_load=0.105, wall_load=0.105,
        ),
        # Excel-published anchors from the verify_baseline.py header:
        #   N=63.79, M=143.90, wind_h=1.036, wind_v=0.207, snow=2.367.
        # We treat them as additional sanity checks alongside the
        # Python-computed values.
        "excel_anchor": {"N_kN": 63.79, "M_kNm": 143.90, "snow_kPa": 2.367},
    },
    {
        "id": "SCN-COL-EDGE-SINGLE-NOTIES",
        "label": "Крайняя колонна, один пролёт, без связей",
        "input": dict(
            span=40, length=80, h=11.5, slope=6,
            frame_pitch=6, fachverk_pitch=6,
            spans="one", ties=False, terrain="B",
            col_type="edge",
            w0=0.6, sg=1.7, gamma_n=1.0, addition=15,
            roof_load=0.105, wall_load=0.105,
        ),
    },
    {
        "id": "SCN-COL-MIDDLE-MULTI-TIES",
        "label": "Средняя колонна, связи=есть, более одного пролёта",
        "input": dict(
            span=40, length=80, h=11.5, slope=6,
            frame_pitch=6, fachverk_pitch=6,
            spans="multi", ties=True, terrain="B",
            col_type="middle",
            w0=0.6, sg=1.7, gamma_n=1.0, addition=15,
            roof_load=0.105, wall_load=0.105,
        ),
    },
    {
        "id": "SCN-COL-H20",
        "label": "h=20м, фахверковая",
        "input": dict(
            span=40, length=80, h=20, slope=6,
            frame_pitch=6, fachverk_pitch=6,
            spans="one", ties=False, terrain="B",
            col_type="fachwerk",
            w0=0.6, sg=1.7, gamma_n=1.0, addition=15,
            roof_load=0.105, wall_load=0.105,
        ),
    },
    {
        "id": "SCN-COL-W085",
        "label": "w0=0.85 (VII р.), фахверковая",
        "input": dict(
            span=40, length=80, h=11.5, slope=6,
            frame_pitch=6, fachverk_pitch=6,
            spans="one", ties=False, terrain="B",
            col_type="fachwerk",
            w0=0.85, sg=1.7, gamma_n=1.0, addition=15,
            roof_load=0.105, wall_load=0.105,
        ),
    },
    {
        "id": "SCN-COL-SG3",
        "label": "Sg=3.0 (VI р.), фахверковая",
        "input": dict(
            span=40, length=80, h=11.5, slope=6,
            frame_pitch=6, fachverk_pitch=6,
            spans="one", ties=False, terrain="B",
            col_type="fachwerk",
            w0=0.6, sg=3.0, gamma_n=1.0, addition=15,
            roof_load=0.105, wall_load=0.105,
        ),
    },
    {
        "id": "SCN-COL-TERRAIN-A",
        "label": "Местность A (открытая), фахверковая",
        "input": dict(
            span=40, length=80, h=11.5, slope=6,
            frame_pitch=6, fachverk_pitch=6,
            spans="one", ties=False, terrain="A",
            col_type="fachwerk",
            w0=0.6, sg=1.7, gamma_n=1.0, addition=15,
            roof_load=0.105, wall_load=0.105,
        ),
    },
    {
        "id": "SCN-COL-SPAN-60",
        "label": "Пролёт 60м, фахверковая",
        "input": dict(
            span=60, length=80, h=11.5, slope=6,
            frame_pitch=6, fachverk_pitch=6,
            spans="one", ties=False, terrain="B",
            col_type="fachwerk",
            w0=0.6, sg=1.7, gamma_n=1.0, addition=15,
            roof_load=0.105, wall_load=0.105,
        ),
    },
    {
        "id": "SCN-COL-SLOPE-20",
        "label": "Уклон кровли 20°, фахверковая",
        "input": dict(
            span=40, length=80, h=11.5, slope=20,
            frame_pitch=6, fachverk_pitch=6,
            spans="one", ties=False, terrain="B",
            col_type="fachwerk",
            w0=0.6, sg=1.7, gamma_n=1.0, addition=15,
            roof_load=0.105, wall_load=0.105,
        ),
    },
    {
        "id": "SCN-COL-EDGE-MULTI-TIES-G11",
        "label": "γₙ=1.1, крайняя, связи, более одного пролёта",
        "input": dict(
            span=40, length=80, h=11.5, slope=6,
            frame_pitch=6, fachverk_pitch=6,
            spans="multi", ties=True, terrain="B",
            col_type="edge",
            w0=0.6, sg=1.7, gamma_n=1.1, addition=15,
            roof_load=0.105, wall_load=0.105,
        ),
    },
]


def main() -> int:
    out = {
        "$schema": "./column-scenarios.schema.json",
        "source": (
            "Generated by scripts/freeze_column_fixtures.py from "
            "scripts/verify_baseline.py (validated against Excel "
            "with 0.00% deviation, see knowledge/log.md)."
        ),
        "tolerances": {
            "relative": 0.005,  # 0.5%
            "absolute_min": 1e-3,
        },
        "scenarios": [],
    }

    for sc in SCENARIOS:
        r = calc(sc["input"])
        entry = {
            "id": sc["id"],
            "label": sc["label"],
            "input": sc["input"],
            "expected": {
                "N_kN": round(r["N"], 6),
                "M_kNm": round(r["M"], 6),
                "snow_kPa": round(r["snow"], 6),
                "windH_kPa": round(r["wind_h"], 6),
                "windV_kPa": round(r["wind_v"], 6),
            },
        }
        if "excel_anchor" in sc:
            entry["excel_anchor"] = sc["excel_anchor"]
        out["scenarios"].append(entry)

    target = os.path.join(
        os.path.dirname(HERE),
        "src", "calc", "__fixtures__", "column-scenarios.json",
    )
    os.makedirs(os.path.dirname(target), exist_ok=True)
    with open(target, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"Wrote {len(SCENARIOS)} scenarios to {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
