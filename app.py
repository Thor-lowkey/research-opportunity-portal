import os 
from flask import Flask, jsonify, request, send_from_directory
import mysql.connector

app = Flask(__name__, static_folder="frontend", static_url_path="")

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="portal_app",
        password=os.environ.get("DB_PASSWORD"),
        database="research_portal"
    )

def query_db(query, params=None, fetchone=False):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)


    try:
        cursor.execute(query, params or ())

        if fetchone:
            return cursor.fetchone()

        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

opportunities = []

@app.route("/", methods=["GET"])

@app.route("/", methods=["GET"])
def home():
    return send_from_directory("frontend", "index.html")

@app.route("/api/opportunities", methods=["GET"])
def get_opportunities():
    opportunities = query_db(
        "SELECT * FROM opportunities ORDER BY id DESC"
    )
    return jsonify(opportunities), 200


@app.route("/api/opportunities/<int:opportunity_id>", methods=["GET"])
def get_opportunity(opportunity_id):
    opportunity = query_db(
        "SELECT * FROM opportunities WHERE id = %s",
        (opportunity_id,),
        fetchone=True
    )

    if opportunity is None:
        return jsonify({"error": "Opportunity not found"}), 404

    return jsonify(opportunity), 200


@app.route("/api/opportunities", methods=["POST"])
def create_opportunity():
    data = request.get_json()

    if not isinstance(data, dict):
        return jsonify({"error": "A valid JSON object is required"}), 400

    if not isinstance(data.get("title"), str) or not data["title"].strip():
        return jsonify({"error": "A non-empty title is required"}), 400

    required_skills = data.get("required_skills", [])
    if not isinstance(required_skills, list):
        return jsonify({"error": "required_skills must be a list"}), 400

    positions = data.get("available_positions", 1)
    if not isinstance(positions, int) or isinstance(positions, bool) or positions < 1:
        return jsonify({"error": "available_positions must be a positive integer"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            INSERT INTO opportunities (
                title, description, research_area, faculty_member,
                department, required_skills, available_positions,
                application_deadline, status
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                data["title"].strip(),
                data.get("description", ""),
                data.get("research_area", ""),
                data.get("faculty_member", ""),
                data.get("department", ""),
                ", ".join(required_skills),
                positions,
                data.get("application_deadline") or None,
                "Open",
            ),
        )
        conn.commit()
        new_id = cursor.lastrowid

        cursor.execute(
            "SELECT * FROM opportunities WHERE id = %s",
            (new_id,),
        )
        opportunity = cursor.fetchone()

        return jsonify(opportunity), 201
    except Exception:
        conn.rollback()
        app.logger.exception("Failed to create opportunity")
        return jsonify({"error": "Failed to create opportunity"}), 500
    finally:
        cursor.close()
        conn.close()


@app.route("/api/opportunities/<int:opportunity_id>", methods=["PUT"])
def update_opportunity(opportunity_id):
    data = request.get_json()

    if not isinstance(data, dict) or not data:
        return jsonify({"error": "A non-empty JSON object is required"}), 400

    allowed_fields = {
        "title", "description", "research_area", "faculty_member",
        "department", "required_skills", "available_positions",
        "application_deadline", "status"
    }

    if not set(data).issubset(allowed_fields):
        return jsonify({"error": "Request contains unsupported fields"}), 400

    if "title" in data and (
        not isinstance(data["title"], str) or not data["title"].strip()
    ):
        return jsonify({"error": "Title must be a non-empty string"}), 400

    if "status" in data and data["status"] not in ["Open", "Closed"]:
        return jsonify({"error": "Status must be Open or Closed"}), 400

    if "required_skills" in data:
        if not isinstance(data["required_skills"], list) or not all(
            isinstance(skill, str) for skill in data["required_skills"]
        ):
            return jsonify({"error": "required_skills must be a list of strings"}), 400

    if "available_positions" in data:
        positions = data["available_positions"]
        if not isinstance(positions, int) or isinstance(positions, bool) or positions < 1:
            return jsonify({"error": "available_positions must be a positive integer"}), 400

    current = query_db(
        "SELECT * FROM opportunities WHERE id = %s",
        (opportunity_id,),
        fetchone=True
    )

    if current is None:
        return jsonify({"error": "Opportunity not found"}), 404

    column_values = dict(data)

    if "title" in column_values:
        column_values["title"] = column_values["title"].strip()

    if "required_skills" in column_values:
        column_values["required_skills"] = ", ".join(column_values["required_skills"])

    if "application_deadline" in column_values and not column_values["application_deadline"]:
        column_values["application_deadline"] = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            assignments = ", ".join(f"{field} = %s" for field in column_values)
            values = list(column_values.values()) + [opportunity_id]

            cursor.execute(
                f"UPDATE opportunities SET {assignments} WHERE id = %s",
                values
            )
            conn.commit()

            cursor.execute(
                "SELECT * FROM opportunities WHERE id = %s",
                (opportunity_id,)
            )
            updated = cursor.fetchone()
            return jsonify(updated), 200
        finally:
            cursor.close()
            conn.close()

    except Exception:
        app.logger.exception("Failed to update opportunity")
        return jsonify({"error": "Failed to update opportunity"}), 500


@app.route("/api/opportunities/<int:opportunity_id>", methods=["DELETE"])
def delete_opportunity(opportunity_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "DELETE FROM opportunities WHERE id = %s",
            (opportunity_id,)
        )

        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "Opportunity not found"}), 404

        conn.commit()

        return jsonify({
            "message": "Opportunity deleted successfully"
        }), 200

    except Exception:
        conn.rollback()
        app.logger.exception("Failed to delete opportunity")
        return jsonify({"error": "Failed to delete opportunity"}), 500

    finally:
        cursor.close()
        conn.close()



if __name__ == "__main__":
    app.run(debug=True, use_reloader = False)
