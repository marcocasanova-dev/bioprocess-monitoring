from contextlib import asynccontextmanager

from fastapi import FastAPI

from biospectrometer import Biospectrometer, read_csv_file


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.spectrometer = Biospectrometer(read_csv_file())
    yield


app = FastAPI(lifespan=lifespan)
