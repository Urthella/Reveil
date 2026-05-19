import Foundation

@MainActor
@Observable
final class HabitsViewModel {
    var habits: [Habit] = []
    var loading = false
    var error: String?
    var categoryFilter: String = "all"

    private let client = APIClient.shared

    func load() async {
        loading = true
        defer { loading = false }
        error = nil
        do {
            var query: [String: String] = [:]
            if categoryFilter != "all" {
                query["category"] = categoryFilter
            }
            habits = try await client.get("habits", query: query)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func create(_ req: CreateHabitRequest) async throws {
        let new: Habit = try await client.post("habits", body: req)
        habits.insert(new, at: 0)
    }

    func delete(_ habit: Habit) async {
        do {
            _ = try await client.delete("habits/\(habit.id)")
            habits.removeAll { $0.id == habit.id }
        } catch {
            self.error = error.localizedDescription
        }
    }

    func togglePause(_ habit: Habit) async {
        do {
            let updated: Habit = try await client.patch(
                "habits/\(habit.id)",
                body: UpdateHabitRequest(active: !habit.active)
            )
            if let idx = habits.firstIndex(where: { $0.id == habit.id }) {
                habits[idx] = updated
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}

