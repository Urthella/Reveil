"""Reveil AI Engine — FastAPI microservice that turns habit stats into
adaptive motivational feedback. Uses OpenAI when OPENAI_API_KEY is set,
otherwise falls back to a deterministic rule-based generator so the rest
of the system keeps working without network access or paid credentials.
"""
from __future__ import annotations

import logging
import os
from typing import Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from feedback import build_prompt, rule_based_feedback, safety_filter

load_dotenv()
logger = logging.getLogger("reveil.ai")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Reveil AI Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FeedbackRequest(BaseModel):
    habitTitle: Optional[str] = None
    habitFrequency: Optional[str] = None
    habitCategory: Optional[str] = None
    consistencyScore: int = Field(ge=0, le=100)
    completedDays: int = Field(ge=0)
    totalDays: int = Field(ge=1)
    currentStreak: int = Field(ge=0)
    locale: Literal["en", "tr"] = "en"
    tone: Literal["gentle", "firm", "playful", "coach"] = "coach"


class FeedbackResponse(BaseModel):
    feedbackText: str
    source: Literal["openai", "rule"]


@app.get("/")
async def root():
    return {
        "status": "active",
        "service": "Reveil AI Engine",
        "openai": bool(os.getenv("OPENAI_API_KEY")),
    }


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/feedback", response_model=FeedbackResponse)
async def feedback(req: FeedbackRequest) -> FeedbackResponse:
    try:
        if os.getenv("OPENAI_API_KEY"):
            text = await _generate_openai(req)
            if text:
                return FeedbackResponse(
                    feedbackText=safety_filter(text, req.locale),
                    source="openai",
                )
    except Exception as exc:  # noqa: BLE001
        logger.warning("OpenAI call failed, falling back: %s", exc)

    return FeedbackResponse(
        feedbackText=safety_filter(rule_based_feedback(req.model_dump()), req.locale),
        source="rule",
    )


async def _generate_openai(req: FeedbackRequest) -> Optional[str]:
    """Call OpenAI Chat Completions. Lazy-imports the SDK so the rule-based
    path keeps working when the package is unavailable."""
    try:
        from openai import AsyncOpenAI
    except ImportError:
        logger.info("openai package not installed; using rule-based path")
        return None

    client = AsyncOpenAI()
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    system, user = build_prompt(req.model_dump())

    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.7,
        max_tokens=180,
    )
    text = (response.choices[0].message.content or "").strip()
    return text or None
