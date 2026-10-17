import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RunResult } from "./types";
import { clsLabel, money } from "./format";
import { chartTheme, housingClassColor } from "../../lib/chartTheme";

export function EpChart({ run }: { run: RunResult }) {
  const data = run.ep_curve.map((row) => ({
    rp: row.return_period_years,
    grossInsured: row.loss_kes,
    groundUp: row.ground_up_loss_kes,
    comparison: run.controls.apply_drainage_correction ? row.baseline_loss_kes : row.drainage_sensitivity_loss_kes,
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid stroke={chartTheme.grid} strokeWidth={1} />
        <XAxis dataKey="rp" axisLine={{ stroke: chartTheme.axis }} tick={{ fill: chartTheme.axisLabel, fontSize: chartTheme.fontSize }} label={{ value: "Assumed return period (years)", fill: chartTheme.axisLabel, fontSize: chartTheme.fontSize, position: "insideBottom", offset: -2 }} />
        <YAxis tickFormatter={(v) => money(Number(v))} axisLine={{ stroke: chartTheme.axis }} tick={{ fill: chartTheme.axisLabel, fontSize: chartTheme.fontSize }} width={88} />
        <Tooltip formatter={(v) => money(Number(v))} contentStyle={chartTheme.tooltip.contentStyle} labelStyle={chartTheme.tooltip.labelStyle} />
        <Legend wrapperStyle={{ color: chartTheme.axisLabel, fontSize: chartTheme.fontSize }} />
        <Line type="monotone" dataKey="grossInsured" stroke={chartTheme.primary} strokeWidth={2.5} name="Gross insured loss" />
        <Line type="monotone" dataKey="groundUp" stroke={chartTheme.navy} strokeWidth={2} name="Ground-up loss" />
        <Line type="monotone" dataKey="comparison" stroke={chartTheme.comparison} strokeDasharray="4 4" strokeWidth={2} name={run.controls.apply_drainage_correction ? 'Proxy-only comparison' : 'Unvalidated drainage sensitivity'} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ClassChart({ run }: { run: RunResult }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={run.by_housing_class.map((r) => ({ ...r, name: clsLabel(r.housing_class) }))} layout="vertical" margin={{ left: 20, right: 12 }}>
        <CartesianGrid stroke={chartTheme.grid} strokeWidth={1} />
        <XAxis type="number" tickFormatter={(v) => money(Number(v))} axisLine={{ stroke: chartTheme.axis }} tick={{ fill: chartTheme.axisLabel, fontSize: chartTheme.fontSize }} />
        <YAxis type="category" dataKey="name" axisLine={{ stroke: chartTheme.axis }} tick={{ fill: chartTheme.axisLabel, fontSize: chartTheme.fontSize }} width={130} />
        <Tooltip formatter={(v) => money(Number(v))} contentStyle={chartTheme.tooltip.contentStyle} labelStyle={chartTheme.tooltip.labelStyle} />
        <Bar dataKey="aal_kes" fill={chartTheme.navy} name="Gross insured AAL" radius={[0, 6, 6, 0]}>{run.by_housing_class.map((row) => <Cell key={row.housing_class} fill={housingClassColor(row.housing_class)} />)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ShapGlobal({ run }: { run: RunResult }) {
  const data = run.explainability.global_shap.slice(0, 8).map((r) => ({
    name: r.feature.replaceAll("_", " "),
    value: r.mean_abs_shap_kes,
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 110 }}>
        <CartesianGrid stroke={chartTheme.grid} strokeWidth={1} />
        <XAxis type="number" tickFormatter={(v) => money(Number(v))} axisLine={{ stroke: chartTheme.axis }} tick={{ fill: chartTheme.axisLabel, fontSize: chartTheme.fontSize }} />
        <YAxis type="category" dataKey="name" axisLine={{ stroke: chartTheme.axis }} tick={{ fill: chartTheme.axisLabel, fontSize: chartTheme.fontSize }} width={110} />
        <Tooltip formatter={(v) => money(Number(v))} contentStyle={chartTheme.tooltip.contentStyle} labelStyle={chartTheme.tooltip.labelStyle} />
        <Bar dataKey="value" fill={chartTheme.comparison} name="Mean |SHAP|" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
