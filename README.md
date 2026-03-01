coming soon 
cd backend

# 1. Copy and fill in environment variables
copy .env.example .env

# 2. Create & activate a virtual environment
python -m venv .venv
.venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Make sure PostgreSQL is running and the DB exists
# psql -U postgres -c "CREATE DATABASE township_gate;"

# 5. Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
Frontend: http://localhost:5174
Backend: http://127.0.0.1:8000 (auto-reloaded with new route)
API docs: http://localhost:8000/docs (test the OCR endpoint directly)