# Bioprocess Monitoring

## About this Project

this is a protoype that simulated a spectrometer, using a backgorund thread that replays forever data retrieved from a csv file with the condition of showing a row every 500ms. every time the index reach its end, the cycle start again. on top of that there is a FastApi rest that expose start control and jump. the project also count with a basic front end /fe done with vite and typescript and plotly

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
npm run dev


### Regenerate API types always after changing api.py

for this the backend needs to be running first (`uvicorn api:app --reload` from the
project root), then:

cd fe
npx openapi-typescript http://127.0.0.1:8000/openapi.json -o src/api-types.ts

auto-generated schema and produces the matching
TypeScript types in `src/api-types.ts`, one source of truth to rule them all

## Notes 
    - yaxis: { title: "Absorbance [mAU]", range: [-0.002, 0.085] }, range was harcoded after getting max min, this could be better handled in the be
    - frontend types are generated for conviniece and mantain one source of true
    - use of lock to avoid race condition 

## Nice to have with more time 
    - tests
    - type hints 
    - loading state / error messages in the front end