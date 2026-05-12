"""Reveil AI Engine — FastAPI microservice that turns habit stats into
adaptive motivational feedback.

Provider chain (first one that returns text wins):
  1. Claude   (ANTHROPIC_API_KEY set)
  2. OpenAI   (OPENAI_API_KEY set)
  3. Rule     (deterministic, always available)

Override via AI_PROVIDER=claude|openai|rule.
"""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Awaitable, Callable, List, Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from feedback import build_prompt, rule_based_feedback, safety_filter

load_dotenv()
logger = logging.getLogger("reveil.ai")
logging.basicConfig(level=logging.INFO)

Source = Literal["claude", "openai", "rule"]

app = FastAPI(title="Reveil AI Engine", version="1.1.0")

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
    source: Source


@dataclass
class Provider:
    name: Source
    generate: Callable[[str, str], Awaitable[Optional[str]]]


async def _generate_claude(system: str, user: str) -> Optional[str]:
    try:
        from anthropic import AsyncAnthropic
    except ImportError:
        logger.info("anthropic package not installed; skipping Claude provider")
        return None

    client = AsyncAnthropic()
    model = os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5")
    response = await client.messages.create(
        model=model,
        max_tokens=180,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    for block in response.content:
        if getattr(block, "type", None) == "text":
            text = (block.text or "").strip()
            if text:
                return text
    return None


async def _generate_openai(system: str, user: str) -> Optional[str]:
    try:
        from openai import AsyncOpenAI
    except ImportError:
        logger.info("openai package not installed; skipping OpenAI provider")
        return None

    client = AsyncOpenAI()
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
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


def _select_chain() -> List[Provider]:
    explicit = (os.getenv("AI_PROVIDER") or "").lower().strip()
    has_claude = bool(os.getenv("ANTHROPIC_API_KEY"))
    has_openai = bool(os.getenv("OPENAI_API_KEY"))

    if explicit == "claude":
        return [Provider("claude", _generate_claude)] if has_claude else []
    if explicit == "openai":
        return [Provider("openai", _generate_openai)] if has_openai else []
    if explicit == "rule":
        return []

    chain: List[Provider] = []
    if has_claude:
        chain.append(Provider("claude", _generate_claude))
    if has_openai:
        chain.append(Provider("openai", _generate_openai))
    return chain


@app.get("/")
async def root():
    return {
        "status": "active",
        "service": "Reveil AI Engine",
        "providers": [p.name for p in _select_chain()] or ["rule"],
    }


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/feedback", response_model=FeedbackResponse)
async def feedback(req: FeedbackRequest) -> FeedbackResponse:
    system, user = build_prompt(req.model_dump())

    for provider in _select_chain():
        try:
            text = await provider.generate(system, user)
        except Exception as exc:  # noqa: BLE001
            logger.warning("%s provider failed, trying next: %s", provider.name, exc)
            continue
        if text:
            return FeedbackResponse(
                feedbackText=safety_filter(text, req.locale),
                source=provider.name,
            )

    return FeedbackResponse(
        feedbackText=safety_filter(rule_based_feedback(req.model_dump()), req.locale),
        source="rule",
    )
