# Bioprocess Monitoring Challenge

## How to run

pip install -r requirements.txt
uvicorn api:app --reload

Server runs at http://127.0.0.1:8000
Docs at http://127.0.0.1:8000/docs

## Try the enpoints in the teminal

curl -X POST http://127.0.0.1:8000/start

curl -X POST http://127.0.0.1:8000/stop

curl -X POST http://127.0.0.1:8000/jump/9999


## Part II the mini UI (fe/)

a simple typeScript for plotting the current spectrum

## How to run

cd fe
npm install


### Regenerate API types always after changing api.py

for this the backend needs to be running first (`uvicorn api:app --reload` from the
project root), then:

cd fe
npx openapi-typescript http://127.0.0.1:8000/openapi.json -o src/api-types.ts

auto-generated schema and produces the matching
TypeScript types in `src/api-types.ts`, one source of truth to rule them all