import SwiftUI

struct HabitRowView: View {
    let habit: Habit

    private var categoryIcon: String {
        HabitCategory(rawValue: habit.category)?.icon ?? "circle"
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: categoryIcon)
                .font(.title3)
                .foregroundStyle(.tint)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 4) {
                Text(habit.title)
                    .font(.body.weight(.medium))

                if let desc = habit.description, !desc.isEmpty {
                    Text(desc)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                HStack(spacing: 10) {
                    Label("\(habit.weeklyTarget)×/week", systemImage: "calendar")
                    if let time = habit.timeOfDay, time != "anytime" {
                        Label(time.capitalized, systemImage: "clock")
                    }
                }
                .font(.caption2)
                .foregroundStyle(.secondary)
            }

            Spacer()

            if !habit.active {
                Text("Paused")
                    .font(.caption2.weight(.semibold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.orange.opacity(0.2), in: Capsule())
                    .foregroundStyle(.orange)
            }
        }
        .padding(.vertical, 4)
    }
}

