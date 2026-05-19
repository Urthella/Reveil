import SwiftUI

struct ProfileView: View {
    @Environment(AuthStore.self) private var auth

    var body: some View {
        NavigationStack {
            Form {
                if case let .signedIn(userId) = auth.state {
                    Section("Account") {
                        LabeledContent("User ID", value: userId)
                        LabeledContent("Mode", value: "Mock auth (dev)")
                    }
                }

                Section("About") {
                    LabeledContent("App", value: "Reveil iOS (native)")
                    LabeledContent("Backend", value: "localhost:3000/api")
                }

                Section {
                    Button(role: .destructive) {
                        auth.signOut()
                    } label: {
                        Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
            .navigationTitle("Profile")
        }
    }
}

