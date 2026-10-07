export type Controls = {
  apply_drainage_correction: boolean;
  free_text: string;
};

export type LocationRow = {
  loc_id: string;
  lat: number;
  lon: number;
  housing_class: string;
  tiv_kes: number;
  nearest_hotspot: string;
  distance_to_hotspot_km: number;
  drainage_uplift: number;
  aal_kes: number;
  loss_cost_pct: number;
  source: string;
  synthetic: boolean;
  scenario_losses_kes: Record<string, number>;
  hazard_scores: Record<string, number>;
};

export type RunResult = {
  run_id: string;
  created_at: string;
  disclaimer: string;
  briefing: string;
  model: { name: string; version: string; currency: string; team: string };
  controls: Controls;
  labels: Record<string, string>;
  metrics: Record<string, number>;
  scenarios: Array<{
    tier: string;
    return_period_years: number;
    annual_exceedance: number;
    meaning: string;
    loss_kes: number;
    baseline_loss_kes: number;
    affected_locations: number;
    affected_tiv_kes: number;
  }>;
  ep_curve: Array<{
    tier: string;
    return_period_years: number;
    annual_exceedance: number;
    loss_kes: number;
    baseline_loss_kes: number;
    provenance: string;
  }>;
  by_housing_class: Array<{
    housing_class: string;
    locations: number;
    tiv_kes: number;
    aal_kes: number;
    loss_cost_pct: number;
  }>;
  by_hotspot: Array<{ name?: string; nearest_hotspot?: string; locations: number; tiv_kes: number; aal_kes: number }>;
  vulnerability_matrix: Array<{
    housing_class: string;
    cap: number;
    differs_from_jrc: string;
    by_depth_m: Record<string, number>;
  }>;
  ai: {
    drainage: {
      enabled: boolean;
      missed_hotspots: string[];
      buildings_uplifted: number;
      method: string;
    };
    free_text: { parsed: boolean; rows_added: number; notes: string[]; place?: string };
    loss_delta_severe_kes: number;
    effect: string;
  };
  explainability: {
    surrogate_r2: number;
    global_shap: Array<{ feature: string; mean_abs_shap_kes: number }>;
    note: string;
  };
  top_locations: LocationRow[];
  locations: LocationRow[];
  hotspots: Array<{ name: string; lat: number; lon: number }>;
  assumptions: Array<{
    id: string;
    provenance: string;
    title: string;
    statement: string;
  }>;
};

export type Explanation = {
  loc_id: string;
  method: string;
  base_value_kes: number;
  surrogate_prediction_kes: number;
  physics_aal_kes: number;
  surrogate_r2: number;
  contributions: Array<{ feature: string; value: number; shap_kes: number }>;
  location: LocationRow;
};
