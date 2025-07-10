import os
import pandas as pd
import numpy as np
from joblib import dump, load
from xgboost import XGBRegressor
from app.models.models import CVEAssetReport, Prediction
from app.config.db import db
# ────────────────────────
#  Rutas y constantes
# ────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, '../ml/modelo_riesgo_mensual.joblib')
CSV_PATH   = os.path.join(BASE_DIR, '../ml/historico_kri_por_cve.csv')

# ────────────────────────
#  Dataset histórico
# ────────────────────────
df_kri = pd.read_csv(CSV_PATH)

# ────────────────────────
#  Creacion y entrenamiento del modelo
# ────────────────────────
FEATURES = ["total_kri", "num_cves", "max_base_score", "avg_score"]

def create_model():
    print("🔄 Modelo no encontrado. Entrenando uno nuevo con XGBoost...")
    df_model = df_kri.dropna(subset=["kri"]).copy()

    # Construye features 1-a-1 con tu lógica actual
    df_model["total_kri"]      = df_model["kri"]
    df_model["num_cves"]       = 1
    df_model["max_base_score"] = df_model["max_base_score"]
    df_model["avg_score"]      = df_model["max_base_score"]

    X = df_model[FEATURES]
    y = df_model["kri"]

    model = XGBRegressor(
        n_estimators=400,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=42,
        n_jobs=-1
    )
    model.fit(X, y)
    dump(model, MODEL_PATH)
    print("✅ Modelo entrenado y guardado como modelo_riesgo_mensual.joblib")
    return model

# Carga o crea el modelo
model = load(MODEL_PATH) if os.path.exists(MODEL_PATH) else create_model()

# ────────────────────────
#  Predicción mensual
# ────────────────────────
def refresh_predictions():
    print("🔄 Iniciando actualización de predicciones...")
    assets = [a[0] for a in db.session.query(CVEAssetReport.asset_id).distinct().all()]

    for asset in assets:
        reports = db.session.query(CVEAssetReport).filter_by(asset_id=asset).all()
        print(f"Procesando {len(reports)} reportes para el activo {asset}...")
        if not reports:
            continue

        df_reports = pd.DataFrame([{
            'cve_id':    r.cve_id,
            'createdAt': r.createdAt,
            'asset_id':  r.asset_id
        } for r in reports])

        df_reports['report_month'] = pd.to_datetime(df_reports['createdAt']).dt.to_period('M').astype(str)
        df_reports = df_reports.dropna(subset=['cve_id'])

        df_joined = df_reports.merge(df_kri, on='cve_id', how='left')
        df_joined['kri'] = df_joined['kri'].fillna(5)
        df_joined['max_base_score'] = df_joined['max_base_score'].fillna(5)

        if df_joined.empty:
            continue

        df_joined = df_joined.drop_duplicates(subset=['asset_id', 'cve_id', 'report_month'])
        grouped = df_joined.groupby('report_month').agg(
            total_kri      = ('kri', 'mean'),
            num_cves       = ('cve_id', 'count'),
            max_base_score = ('max_base_score', 'max'),
            avg_score      = ('max_base_score', 'mean')
        ).reset_index()

        grouped['asset_id']   = asset
        grouped['year_month'] = grouped['report_month'].astype(str)

        for _, row in grouped.iterrows():
            # Comprueba si ya existe una predicción para ese asset_id y year_month
            exists = db.session.query(Prediction).filter(
                Prediction.asset_id == row['asset_id'],
                Prediction.year_month == row['year_month']
            ).first()
            if exists:
                print(f"Predicción ya existe para {row['asset_id']} en {row['year_month']}, omitiendo.")
                continue

            X_pred = pd.DataFrame([{
                'total_kri':      row['total_kri'],
                'num_cves':       row['num_cves'],
                'max_base_score': row['max_base_score'],
                'avg_score':      row['avg_score']
            }])

            risk_pred = float(model.predict(X_pred)[0])
            risk_pred = round(np.clip(risk_pred, 0, 10), 2)

            pred = Prediction(
                asset_id           = row['asset_id'],
                year_month         = row['year_month'],
                total_kri          = row['total_kri'],
                num_cves           = row['num_cves'],
                max_score          = row['max_base_score'],
                avg_score          = row['avg_score'],
                riesgo_mes_siguiente = risk_pred
            )
            print(f"Predicción para {row['asset_id']} en {row['year_month']}: {risk_pred}")
            db.session.add(pred)

    db.session.commit()
    print("✅ Predicciones actualizadas")


# ────────────────────────
#  Predictions service
# ────────────────────────
def getAllPredictions():
    """
    Obtiene todas las predicciones de riesgo mensual.
    """
    try:
        predictions = db.session.query(Prediction).all()
        if not predictions:
            return []
        return [p.to_dict() for p in predictions]
    except Exception as e:
        print(f"Error al obtener predicciones: {e}")
        return []

def getAllPredictionsByAssetIds(asset_ids):
    """
    Obtiene todas las predicciones de riesgo mensual para una lista de activos específicos.
    """
    try:
        if not asset_ids:
            return []
        predictions = db.session.query(Prediction).filter(Prediction.asset_id.in_(asset_ids)).all()
        if not predictions:
            return []
        return [p.to_dict() for p in predictions]
    except Exception as e:
        print(f"Error al obtener predicciones por activos: {e}")
        return []

def getPredictionsByAsset(asset_id):
    """
    Obtiene las predicciones de riesgo mensual para un activo específico.
    """
    try:
        predictions = db.session.query(Prediction).filter(Prediction.asset_id == asset_id).all()
        if not predictions:
            return []
        return [p.to_dict() for p in predictions]
    except Exception as e:
        print(f"Error al obtener predicciones para el activo {asset_id}: {e}")
        return []

def deletePredictionsById(id):
    """
    Elimina una predicción específica por su ID.
    """
    try:
        prediction = db.session.query(Prediction).filter_by(id=id).first()
        if not prediction:
            return {"message": "Predicción no encontrada"}, 404
        db.session.delete(prediction)
        db.session.commit()
        return {"message": "Predicción eliminada exitosamente"}, 200
    except Exception as e:
        print(f"Error al eliminar la predicción: {e}")
        return {"error": str(e)}, 500