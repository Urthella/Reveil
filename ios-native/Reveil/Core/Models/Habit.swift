import Foundation

struct Habit: Codable, Identifiable, Hashable {
    let id: String
    var title: String
    var description: String?
    var frequency: String
    var targetCount: Int
    var timeOfDay: String?
    var category: String
    var active: Bool
    var pausedUntil: String?
    var sortIndex: Int
    var weeklyTarget: Int
    let userId: String
    var createdAt: String?
    var updatedAt: String?
}

enum HabitCategory: String, CaseIterable, Identifiable {
    case general, health, productivity, mindfulness, social, recovery
    var id: String { rawValue }

    var label: String {
        switch self {
        case .general:      return "General"
        case .health:       return "Health"
        case .productivity: return "Productivity"
        case .mindfulness:  return "Mindfulness"
        case .social:       return "Social"
        case .recovery:     return "Recovery"
        }
    }

    var icon: String {
        switch self {
        case .general:      return "circle"
        case .health:       return "heart.fill"
        case .productivity: return "bolt.fill"
        case .mindfulness:  return "leaf.fill"
        case .social:       return "person.2.fill"
        case .recovery:     return "shield.fill"
        }
    }
}

enum HabitFrequency: String, CaseIterable, Identifiable {
    case daily, weekly
    var id: String { rawValue }
}

enum HabitTimeOfDay: String, CaseIterable, Identifiable {
    case anytime, morning, afternoon, evening
    var id: String { rawValue }
}

struct CreateHabitRequest: Encodable {
    var title: String
    var description: String?
    var frequency: String
    var targetCount: Int?
    var timeOfDay: String?
    var category: String?
    var weeklyTarget: Int?
}

struct UpdateHabitRequest: Encodable {
    var title: String?
    var description: String?
    var frequency: String?
    var targetCount: Int?
    var timeOfDay: String?
    var category: String?
    var active: Bool?
    var pausedUntil: String?
    var weeklyTarget: Int?
}

