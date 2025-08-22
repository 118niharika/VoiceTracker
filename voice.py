from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import datetime

app = Flask(__name__)
CORS(app)

DB_FILE = "finvoice.sqlite"

# Ensure database & table exist
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT,
            amount REAL,
            category TEXT,
            description TEXT
        )
    ''')
    conn.commit()
    conn.close()

@app.route("/add_expense", methods=["POST"])
def add_expense():
    data = request.get_json()
    description = data.get("description", "")
    amount = data.get("amount", 0)
    category = data.get("category", "General")
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO expenses (ts, amount, category, description) VALUES (?, ?, ?, ?)",
              (ts, amount, category, description))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})


@app.route("/expenses", methods=["GET"])
def get_expenses():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT ts, amount, category, description FROM expenses ORDER BY id DESC LIMIT 10")
    rows = c.fetchall()
    conn.close()

    expenses = [
        {"ts": r[0], "amount": r[1], "category": r[2], "description": r[3]}
        for r in rows
    ]

    insights = {
        "suggestions": ["Try to save 20% of income", "Review subscriptions"],
        "sipProposal": {"monthly": 2000, "horizonMonths": 24, "projectedValue": 60000}
    }

    return jsonify({"expenses": expenses, "insights": insights})


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
