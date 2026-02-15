from __future__ import annotations

from contextlib import asynccontextmanager
import asyncio
from typing import Set

from fastapi import FastAPI
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .discord_bot import start_bot, stop_bot
from .routes import router


@asynccontextmanager
async def lifespan(_: FastAPI):
    await start_bot()
    yield
    await stop_bot()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


class WebSocketManager:
    def __init__(self) -> None:
        self.active: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.active.discard(websocket)

    async def broadcast(self, payload: dict) -> None:
        for ws in list(self.active):
            try:
                await ws.send_json(payload)
            except RuntimeError:
                self.disconnect(ws)


ws_manager = WebSocketManager()


@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket) -> None:
    await ws_manager.connect(websocket)
    try:
        while True:
            await asyncio.sleep(5)
            await ws_manager.broadcast({"type": "heartbeat"})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
