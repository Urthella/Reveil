import SwiftUI

struct LoginView: View {
    @Environment(AuthStore.self) private var auth
    @State private var userId: String = "demo-user"
    @State private var loading = false
    @State private var error: String?

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            VStack(spacing: 8) {
                Image(systemName: "sparkles")
                    .font(.system(size: 56, weight: .bold))
                    .foregroundStyle(.tint)
                Text("Reveil")
                    .font(.largeTitle.weight(.bold))
                Text("The dawn of your better self.")
                    .foregroundStyle(.secondary)
                    .italic()
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("User ID")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                TextField("demo-user", text: $userId)
                    .textFieldStyle(.roundedBorder)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                Text("Backend is in mock-auth mode — any ID works. Use `demo-user` to see seeded data.")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal)

            Button {
                Task { await login() }
            } label: {
                Group {
                    if loading {
                        ProgressView()
                    } else {
                        Text("Continue").bold()
                    }
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(userId.trimmingCharacters(in: .whitespaces).isEmpty || loading)
            .padding(.horizontal)

            if let error {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding(.horizontal)
            }

            Spacer()
        }
        .padding(.vertical)
    }

    private func login() async {
        loading = true
        defer { loading = false }
        error = nil
        do {
            try await auth.signIn(userId: userId)
        } catch {
            self.error = error.localizedDescription
        }
    }
}
