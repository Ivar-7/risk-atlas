from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor

try:
    import shap
except ImportError:  # Python 3.14 may not have a shap wheel
    shap = None

FEATURE_ORDER = [
    "hazard_score_common",
    "hazard_score_occasional",
    "hazard_score_moderate",
    "hazard_score_severe",
    "hazard_score_extreme",
    "tiv_kes",
    "floor_area_m2",
    "distance_to_hotspot_km",
    "drainage_uplift",
    "is_informal",
    "is_semi_permanent",
    "is_masonry",
    "is_rcc",
]


def _design_matrix(exposure: pd.DataFrame) -> pd.DataFrame:
    return pd.DataFrame(
        {
            "hazard_score_common": exposure["hazard_score_common"],
            "hazard_score_occasional": exposure["hazard_score_occasional"],
            "hazard_score_moderate": exposure["hazard_score_moderate"],
            "hazard_score_severe": exposure["hazard_score_severe"],
            "hazard_score_extreme": exposure["hazard_score_extreme"],
            "tiv_kes": exposure["tiv_kes"],
            "floor_area_m2": exposure["floor_area_m2"],
            "distance_to_hotspot_km": exposure["distance_to_hotspot_km"],
            "drainage_uplift": exposure["drainage_uplift"] if "drainage_uplift" in exposure.columns else 0.0,
            "is_informal": (exposure["housing_class"] == "informal_iron_sheet").astype(float),
            "is_semi_permanent": (exposure["housing_class"] == "semi_permanent").astype(float),
            "is_masonry": (exposure["housing_class"] == "permanent_masonry").astype(float),
            "is_rcc": (exposure["housing_class"] == "concrete_rcc").astype(float),
        }
    )[FEATURE_ORDER]


class LocationExplainer:
    def __init__(self, exposure: pd.DataFrame, aal: np.ndarray):
        self.X = _design_matrix(exposure.reset_index(drop=True))
        self.y = np.asarray(aal, dtype=float)
        self.model = GradientBoostingRegressor(
            n_estimators=80, max_depth=3, learning_rate=0.08, subsample=0.9, random_state=42
        )
        self.model.fit(self.X, self.y)
        self.pred = self.model.predict(self.X)
        denom = max(float(np.sum((self.y - self.y.mean()) ** 2)), 1e-9)
        self.r2 = float(1 - np.sum((self.y - self.pred) ** 2) / denom)
        if shap is not None:
            explainer = shap.TreeExplainer(self.model)
            self.shap_values = np.asarray(explainer.shap_values(self.X))
            self.base_value = float(np.asarray(explainer.expected_value).reshape(-1)[0])
            self.method = "TreeSHAP on a gradient-boosting surrogate of location AAL"
        else:
            means = self.X.mean(axis=0)
            contrib = np.zeros_like(self.X.to_numpy(), dtype=float)
            X_arr = self.X.to_numpy(copy=True)
            for j in range(X_arr.shape[1]):
                muted = X_arr.copy()
                muted[:, j] = means.iloc[j]
                contrib[:, j] = self.pred - self.model.predict(muted)
            self.shap_values = contrib
            self.base_value = float(self.pred.mean())
            self.method = "Leave-one-feature-at-mean contributions (shap package unavailable)"

    def global_importance(self) -> list[dict]:
        mean_abs = np.abs(self.shap_values).mean(axis=0)
        rows = [{"feature": n, "mean_abs_shap_kes": float(v)} for n, v in zip(FEATURE_ORDER, mean_abs)]
        return sorted(rows, key=lambda r: r["mean_abs_shap_kes"], reverse=True)

    def explain_row(self, index: int, loc_id: str, physics_aal: float) -> dict:
        contrib = [
            {
                "feature": name,
                "value": float(self.X.iloc[index][name]),
                "shap_kes": float(self.shap_values[index, i]),
            }
            for i, name in enumerate(FEATURE_ORDER)
        ]
        contrib.sort(key=lambda r: abs(r["shap_kes"]), reverse=True)
        return {
            "loc_id": loc_id,
            "method": self.method,
            "base_value_kes": self.base_value,
            "surrogate_prediction_kes": float(self.pred[index]),
            "physics_aal_kes": float(physics_aal),
            "surrogate_r2": self.r2,
            "contributions": contrib,
        }
