import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            HabitsListView()
                .tabItem { Label("Habits", systemImage: "checklist") }

            DashboardView()
                .tabItem { Label("Dashboard", systemImage: "chart.bar.fill") }

            ProfileView()
                .tabItem { Label("Profile", systemImage: "person.crop.circle") }
        }
    }
}

