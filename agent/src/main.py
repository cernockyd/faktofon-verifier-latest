import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from src.graph import event_stream

# from src.graph_recommendation import event_stream
from src.schema import AgentCardToolRequest

_ = load_dotenv()

app = FastAPI()

origins = os.getenv("ALLOW_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/debug")
async def debug_endpoint(request: Request):
    body = await request.body()
    print(body.decode("utf-8", errors="ignore"))
    return {"received": True}


@app.post("/agent")
async def analyze_card(card_request: AgentCardToolRequest):
    return StreamingResponse(
        event_stream(card_request),
        media_type="application/x-ndjson",
    )
