# Bioprocess Monitoring Challenge

## How to run

pip install -r requirements.txt
uvicorn api:app --reload

Server runs at http://127.0.0.1:8000
Docs at http://127.0.0.1:8000/docs

## Try the enpoints in the teminal

curl -X POST http://127.0.0.1:8000/start

curl -X POST http://127.0.0.1:8000/stop