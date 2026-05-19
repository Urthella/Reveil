import SwiftUI

struct DashboardView: View {
    var body: some View {
        NavigationStack {
            ContentUnavailableView(
                "Coming on Day 2",
                systemImage: "chart.bar.fill",
                description: Text("Streak, consistency, weekly chart & heatmap")
            )
            .navigationTitle("Dashboard")
        }
    }
}

