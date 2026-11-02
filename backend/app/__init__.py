"""AuthNode certificate API."""

from flask import Flask
from flask_cors import CORS


def create_app():
    app = Flask(__name__)

    # Enable frontend requests
    CORS(app)

    # Basic health-check route
    @app.route("/", methods=["GET"])
    def home():
        return {
            "success": True,
            "message": "AuthNode Certificate API is running!"
        }, 200

    @app.route("/health", methods=["GET"])
    def health():
        return {
            "success": True,
            "status": "healthy"
        }, 200

    return app