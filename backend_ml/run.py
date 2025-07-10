from app import create_app
from app.config.server import SERVER_IP, SERVER_PORT

app = create_app()

if __name__ == "__main__":
    app.run(debug=False, host=SERVER_IP, port=SERVER_PORT)
