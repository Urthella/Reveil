import SwiftUI

struct HabitsListView: View {
    @State private var vm = HabitsViewModel()
    @State private var showingCreate = false

    var body: some View {
        NavigationStack {
            Group {
                if vm.loading && vm.habits.isEmpty {
                    ProgressView()
                } else if vm.habits.isEmpty {
                    ContentUnavailableView(
                        "No habits yet",
                        systemImage: "checklist",
                        description: Text("Tap + to add your first habit")
                    )
                } else {
                    List {
                        ForEach(vm.habits) { habit in
                            HabitRowView(habit: habit)
                                .swipeActions(edge: .trailing) {
                                    Button(role: .destructive) {
                                        Task { await vm.delete(habit) }
                                    } label: {
                                        Label("Delete", systemImage: "trash")
                                    }
                                    Button {
                                        Task { await vm.togglePause(habit) }
                                    } label: {
                                        Label(habit.active ? "Pause" : "Resume",
                                              systemImage: habit.active ? "pause.fill" : "play.fill")
                                    }
                                    .tint(.orange)
                                }
                        }
                    }
                    .refreshable { await vm.load() }
                }
            }
            .navigationTitle("Habits")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingCreate = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingCreate) {
                CreateHabitView { req in
                    try await vm.create(req)
                }
            }
            .alert("Error", isPresented: Binding(
                get: { vm.error != nil },
                set: { if !$0 { vm.error = nil } }
            )) {
                Button("OK") { vm.error = nil }
            } message: {
                Text(vm.error ?? "")
            }
            .task {
                if vm.habits.isEmpty { await vm.load() }
            }
        }
    }
}

