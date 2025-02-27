from backend.app.run import app  # ✅ Adjusted to import from run.py

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
