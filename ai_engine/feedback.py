"""Prompt building, rule-based feedback, and safety filtering for the
Reveil AI engine. Kept dependency-free so it can be unit-tested without
the FastAPI runtime."""
from __future__ import annotations

from typing import Dict, Tuple

# Words that strongly suggest harmful encouragement of relapse or self-harm.
# Matched in both English and Turkish for the small set of high-risk phrases.
_BLOCKED_TERMS = (
    "relapse is fine",
    "give up",
    "you should drink",
    "you should smoke",
    "use drugs",
    "self-harm",
    "kill yourself",
    "suicide",
    "you'll never",
    "worthless",
    "içmeye devam",
    "tekrar iç",
    "tekrar kullan",
    "kendine zarar",
    "hayatına son",
)

_FALLBACK_SAFE = {
    "en": (
        "Keep going one small step at a time. Your effort today shapes "
        "tomorrow's identity — what is the smallest version of this habit "
        "you can do right now?"
    ),
    "tr": (
        "Adım adım ilerle. Bugün attığın küçük adım yarınki kimliğini "
        "şekillendiriyor — bu alışkanlığın şu an yapabileceğin en küçük "
        "versiyonu nedir?"
    ),
}


def safety_filter(text: str, locale: str = "en") -> str:
    if not text or not text.strip():
        return _FALLBACK_SAFE.get(locale, _FALLBACK_SAFE["en"])
    lowered = text.lower()
    for term in _BLOCKED_TERMS:
        if term in lowered:
            return _FALLBACK_SAFE.get(locale, _FALLBACK_SAFE["en"])
    return text.strip()


_TONE_HINTS_EN = {
    "gentle": "Use a soft, encouraging voice — no pressure, no metrics-dominated phrasing.",
    "firm": "Be direct and accountability-focused. Name the gap; suggest the next concrete action.",
    "playful": "Add a little humor and wordplay; keep it warm and energizing.",
    "coach": "Speak like a behavioral coach: structured, specific, and forward-looking.",
}
_TONE_HINTS_TR = {
    "gentle": "Yumuşak, cesaretlendirici bir ton kullan — baskı yok, sayılarla ezici olma.",
    "firm": "Doğrudan ve sorumluluk odaklı ol. Açığı ismiyle koy; net bir sonraki adım öner.",
    "playful": "Hafif bir mizah ve enerjik bir dil ekle; sıcaklığı koru.",
    "coach": "Davranış koçu gibi konuş: yapılandırılmış, somut, ileri bakan.",
}

_CATEGORY_HINTS_EN = {
    "health": "Frame the next step around physical wellbeing.",
    "productivity": "Tie the next step to a focused, finite work block.",
    "mindfulness": "Frame the next step around presence and breath.",
    "social": "Tie the next step to a person they can connect with.",
    "recovery": "Use trauma-informed, non-judgmental language; avoid shame triggers.",
    "general": "",
}
_CATEGORY_HINTS_TR = {
    "health": "Sonraki adımı bedensel sağlık etrafında çerçevele.",
    "productivity": "Sonraki adımı kısa, odaklı bir iş bloğuna bağla.",
    "mindfulness": "Sonraki adımı an'a ve nefese bağla.",
    "social": "Sonraki adımı bağ kurabileceği bir kişiye yönelt.",
    "recovery": "Yargılayıcı olmayan, travma duyarlı bir dil kullan; utanç tetiklemekten kaçın.",
    "general": "",
}


def build_prompt(stats: Dict) -> Tuple[str, str]:
    locale = (stats.get("locale") or "en").lower()
    habit = stats.get("habitTitle") or ("alışkanlıkları" if locale == "tr" else "their daily habits")
    score = stats.get("consistencyScore", 0)
    streak = stats.get("currentStreak", 0)
    completed = stats.get("completedDays", 0)
    total = stats.get("totalDays", 30)
    category = (stats.get("habitCategory") or "general").lower()
    tone = (stats.get("tone") or "coach").lower()

    if locale == "tr":
        system = (
            "Sen Reveil'sın — davranış bilimi temelli bir alışkanlık koçu. "
            "2-3 kısa cümlede sıcak, somut ve eyleme dönüştürülebilir Türkçe yanıt ver. "
            "Asla nüksetmeyi, kendini suçlamayı veya zararlı davranışı teşvik etme. "
            "Verilen sayıları kullan, sayı uydurma. "
            + _TONE_HINTS_TR.get(tone, "")
        )
        hint = _CATEGORY_HINTS_TR.get(category, "")
        user = (
            f"Kullanıcı '{habit}' üzerinde çalışıyor (kategori: {category}). "
            f"Son {total} günde {completed} gün tamamlanmış (%{score} tutarlılık). "
            f"Mevcut seri: {streak} gün. "
            f"{hint} "
            "Bu sayılara dayanan motive edici bir geri bildirim yaz ve "
            "tek bir somut sonraki adım öner."
        ).strip()
        return system, user

    system = (
        "You are Reveil, a behavioral science coach. Respond in 2-3 short "
        "sentences. Be warm, specific, and actionable. Never encourage "
        "relapse, self-blame, or harmful behavior. Use the user's data to "
        "ground your advice — do not invent numbers. "
        + _TONE_HINTS_EN.get(tone, "")
    )
    hint = _CATEGORY_HINTS_EN.get(category, "")
    user = (
        f"User is working on '{habit}' (category: {category}). "
        f"Last {total} days: {completed} days completed "
        f"({score}% consistency). Current streak: {streak} days. "
        f"{hint} "
        "Write motivational feedback grounded in these numbers and suggest "
        "one concrete next step."
    ).strip()
    return system, user


def rule_based_feedback(stats: Dict) -> str:
    locale = (stats.get("locale") or "en").lower()
    title = stats.get("habitTitle")
    score = stats.get("consistencyScore", 0)
    streak = stats.get("currentStreak", 0)
    completed = stats.get("completedDays", 0)
    total = stats.get("totalDays", 30)

    if locale == "tr":
        subject = f'"{title}" alışkanlığın' if title else "alışkanlıkların"
        if streak >= 14:
            return (
                f"İki hafta üst üste {subject} için — bu artık kimlik. "
                f"Bugünün en küçük taahhüdü seriyi büyütmeye yetiyor."
            )
        if streak >= 7:
            return (
                f"Harika — {subject} için üst üste {streak} gün. "
                f"İstikrar kimliğe dönüşüyor; bugün de seriyi yaşat."
            )
        if score >= 70:
            return (
                f"Güçlü ritim: son {total} günde {subject} için %{score}. "
                f"Gerçek bir ivme yakalıyorsun — yarınki dilimi şimdiden koru."
            )
        if score >= 40:
            return (
                f"Sağlam bir temel: %{score}. Bu hafta üst üste iki gün "
                f"yapmayı hedefle — alışkanlıklar orada yerleşmeye başlar."
            )
        if completed == 0:
            return (
                f"Her başlangıç sayılır. Bugün {subject} için en küçük "
                f"versiyon yeter — bir dakikalık başlangıç mükemmel plana üstündür."
            )
        return (
            f"İlerleme doğrusal değildir. {completed}/{total} gün — "
            f"bugün için tek bir küçük zafer seç, yarını o sürüklesin."
        )

    subject = f'your "{title}" habit' if title else "your habits"
    if streak >= 14:
        return (
            f"Two weeks straight on {subject} — that's identity territory. "
            f"Today's smallest commitment keeps the streak compounding."
        )
    if streak >= 7:
        return (
            f"Outstanding — {streak} days in a row on {subject}. "
            f"Consistency is becoming identity. Keep the streak alive today."
        )
    if score >= 70:
        return (
            f"Strong rhythm: {score}% on {subject} over the last {total} days. "
            f"You're building real momentum — protect tomorrow's slot."
        )
    if score >= 40:
        return (
            f"Decent baseline at {score}% on {subject}. Aim to stack two "
            f"consecutive days this week — that's where habits start to lock in."
        )
    if completed == 0:
        return (
            f"New beginnings count. The smallest doable version of {subject} "
            f"today is enough — a one-minute start beats a perfect plan."
        )
    return (
        f"Progress isn't linear. {completed}/{total} days on {subject} — "
        f"pick one tiny win for today and let it pull tomorrow with it."
    )
