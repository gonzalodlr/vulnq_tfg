""" from flask import Flask
from app.routes import api

def create_app():
    app = Flask(__name__)
    app.register_blueprint(api, url_prefix="/api")
    return app
 """

from flask import Flask
from flask_cors import CORS
from app.config.db import db, DATABASE_URI
from app.routes import api
from app.config.server import FRONTEND_URL

def create_app():
    app = Flask(__name__)
    CORS(
    app,
    supports_credentials=True,
    origins=[FRONTEND_URL],  # O el dominio de tu frontend
)  # Esto permite CORS para todos los orígenes y rutas
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
    db.init_app(app)

    with app.app_context():
        app.register_blueprint(api, url_prefix="/api")

    return app