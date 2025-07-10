from app.config.db import db

class CVEAssetReport(db.Model):
    __tablename__ = 'cve_asset_reports'
    id = db.Column(db.String(36), primary_key=True)
    asset_id = db.Column(db.String(255), nullable=False)
    cve_id = db.Column(db.String(255), nullable=False)
    createdAt = db.Column(db.DateTime, nullable=False)

class Prediction(db.Model):
    __tablename__ = 'predictions'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    asset_id = db.Column(db.String(255), nullable=False)
    year_month = db.Column(db.String(7), nullable=False)  # Format: YYYY-MM
    total_kri = db.Column(db.Float)
    num_cves = db.Column(db.Integer)
    max_score = db.Column(db.Float)
    avg_score = db.Column(db.Float)
    riesgo_mes_siguiente = db.Column(db.Float)

    __table_args__ = (
        db.UniqueConstraint('asset_id', 'year_month', name='uq_asset_month'),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "asset_id": self.asset_id,
            "year_month": self.year_month,
            "total_kri": self.total_kri,
            "num_cves": self.num_cves,
            "max_score": self.max_score,
            "avg_score": self.avg_score,
            "riesgo_mes_siguiente": self.riesgo_mes_siguiente
        }
