from feedback import rule_based_feedback, safety_filter, build_prompt


def test_rule_based_streak_message():
    out = rule_based_feedback(
        {"consistencyScore": 90, "currentStreak": 10, "completedDays": 27, "totalDays": 30, "habitTitle": "Reading"}
    )
    assert "10 days" in out


def test_rule_based_no_logs_message():
    out = rule_based_feedback(
        {"consistencyScore": 0, "currentStreak": 0, "completedDays": 0, "totalDays": 30}
    )
    assert "smallest" in out.lower()


def test_safety_filter_blocks_harmful():
    assert safety_filter("You should drink and forget your goals") != "You should drink and forget your goals"


def test_safety_filter_passes_safe():
    safe = "Great pace — keep your streak alive today."
    assert safety_filter(safe) == safe


def test_build_prompt_includes_numbers():
    system, user = build_prompt(
        {"habitTitle": "Run", "consistencyScore": 50, "completedDays": 15, "totalDays": 30, "currentStreak": 3}
    )
    assert "50%" in user
    assert "Run" in user
    assert "Reveil" in system


def test_build_prompt_turkish_locale():
    system, user = build_prompt(
        {"habitTitle": "Koşu", "consistencyScore": 50, "completedDays": 15, "totalDays": 30, "currentStreak": 3, "locale": "tr"}
    )
    assert "%50" in user
    assert "Koşu" in user
    assert "Reveil" in system
    # Common Turkish marker
    assert "Türkçe" in system or "alışkanlık" in user


def test_rule_based_turkish_streak():
    out = rule_based_feedback(
        {"consistencyScore": 90, "currentStreak": 10, "completedDays": 27, "totalDays": 30, "habitTitle": "Okuma", "locale": "tr"}
    )
    assert "10 gün" in out


def test_safety_filter_blocks_turkish_relapse_phrase():
    bad = "Bugün tekrar iç, sorun değil"
    assert safety_filter(bad, locale="tr") != bad
    assert "Adım adım" in safety_filter(bad, locale="tr")


def test_recovery_category_uses_trauma_informed_hint():
    system, user = build_prompt(
        {
            "habitTitle": "No alcohol",
            "consistencyScore": 30,
            "completedDays": 9,
            "totalDays": 30,
            "currentStreak": 0,
            "habitCategory": "recovery",
        }
    )
    assert "trauma-informed" in user.lower() or "non-judgmental" in user.lower()


def test_tone_appears_in_system_prompt():
    system, _ = build_prompt(
        {
            "habitTitle": "Reading",
            "consistencyScore": 60,
            "completedDays": 18,
            "totalDays": 30,
            "currentStreak": 4,
            "tone": "playful",
        }
    )
    assert "humor" in system.lower() or "playful" in system.lower() or "energizing" in system.lower()


def test_default_tone_is_coach():
    system, _ = build_prompt(
        {
            "habitTitle": "Reading",
            "consistencyScore": 60,
            "completedDays": 18,
            "totalDays": 30,
            "currentStreak": 4,
        }
    )
    assert "coach" in system.lower() or "structured" in system.lower()


def test_category_appears_in_user_prompt():
    _, user = build_prompt(
        {
            "habitTitle": "Reading",
            "consistencyScore": 70,
            "completedDays": 21,
            "totalDays": 30,
            "currentStreak": 5,
            "habitCategory": "productivity",
        }
    )
    assert "productivity" in user
