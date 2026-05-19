import SwiftUI

struct CreateHabitView: View {
    let onCreate: (CreateHabitRequest) async throws -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var description = ""
    @State private var category: HabitCategory = .general
    @State private var frequency: HabitFrequency = .daily
    @State private var timeOfDay: HabitTimeOfDay = .anytime
    @State private var weeklyTarget = 7
    @State private var saving = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Title") {
                    TextField("e.g. Morning run", text: $title)
                }

                Section("Details") {
                    TextField("Description (optional)", text: $description, axis: .vertical)
                        .lineLimit(2...4)

                    Picker("Category", selection: $category) {
                        ForEach(HabitCategory.allCases) { c in
                            Label(c.label, systemImage: c.icon).tag(c)
                        }
                    }

                    Picker("Frequency", selection: $frequency) {
                        Text("Daily").tag(HabitFrequency.daily)
                        Text("Weekly").tag(HabitFrequency.weekly)
                    }

                    Picker("Time of day", selection: $timeOfDay) {
                        Text("Anytime").tag(HabitTimeOfDay.anytime)
                        Text("Morning").tag(HabitTimeOfDay.morning)
                        Text("Afternoon").tag(HabitTimeOfDay.afternoon)
                        Text("Evening").tag(HabitTimeOfDay.evening)
                    }

                    Stepper("Target: \(weeklyTarget)×/week",
                            value: $weeklyTarget, in: 1...7)
                }

                if let error {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .navigationTitle("New Habit")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await save() }
                    } label: {
                        if saving { ProgressView() } else { Text("Save").bold() }
                    }
                    .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || saving)
                }
            }
        }
    }

    private func save() async {
        saving = true
        defer { saving = false }
        error = nil
        let req = CreateHabitRequest(
            title: title.trimmingCharacters(in: .whitespaces),
            description: description.isEmpty ? nil : description,
            frequency: frequency.rawValue,
            targetCount: nil,
            timeOfDay: timeOfDay.rawValue,
            category: category.rawValue,
            weeklyTarget: weeklyTarget
        )
        do {
            try await onCreate(req)
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }
}

