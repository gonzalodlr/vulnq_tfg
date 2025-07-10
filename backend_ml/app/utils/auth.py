from flask import request, jsonify, g
from functools import wraps
import jwt
from app.config.server import TOKEN

class SecurityService:
    def get_session(self, token):
        try:
            session = jwt.decode(token, TOKEN, algorithms=["HS256"])
            return {"session": session}
        except jwt.InvalidTokenError:
            return None

security_service = SecurityService()

def authenticate_middleware(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        authorization = request.cookies.get("session_token")
        # Elimina el prefijo 'Bearer ' si está presente
        raw = authorization.replace("Bearer ", "") if authorization else None
        if not raw or len(raw) == 0:
            return "You need to be authenticated", 403
        try:
            data = security_service.get_session(raw)
            if data and data.get("session"):
                g.session = data["session"]
                return func(*args, **kwargs)
            else:
                return jsonify({"message": "Invalid or expired token"}), 401
        except Exception:
            resp = jsonify({"message": "Invalid or expired token"})
            resp.set_cookie("session_token", "", expires=0, httponly=True, samesite="Strict", secure=True)
            return resp, 401
    return wrapper
