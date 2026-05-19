import Foundation

@MainActor
@Observable
final class AuthStore {
    enum State: Equatable {
        case loading
        case signedOut
        case signedIn(userId: String)
    }

    var state: State = .loading

    private let client = APIClient.shared
    private let storageKey = "reveil.auth.userId"

    func bootstrap() {
        if let saved = UserDefaults.standard.string(forKey: storageKey), !saved.isEmpty {
            client.authToken = "mock-token"
            client.userId = saved
            state = .signedIn(userId: saved)
        } else {
            state = .signedOut
        }
    }

    /// Mock sign-in: backend's FirebaseAdminService is in mock mode and trusts
    /// the `x-user-id` header. When we wire real Firebase later, replace this
    /// with Firebase iOS SDK's sign-in + getIDToken().
    func signIn(userId: String) async throws {
        let trimmed = userId.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        client.authToken = "mock-token"
        client.userId = trimmed
        UserDefaults.standard.set(trimmed, forKey: storageKey)
        state = .signedIn(userId: trimmed)
    }

    func signOut() {
        UserDefaults.standard.removeObject(forKey: storageKey)
        client.authToken = nil
        client.userId = nil
        state = .signedOut
    }
}

