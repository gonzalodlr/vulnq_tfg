# create_tables.py
from app.config.db import create_all_tables
from app.models.models import Prediction


if __name__ == '__main__':
    create_all_tables()