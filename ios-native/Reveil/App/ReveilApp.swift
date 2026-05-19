import SwiftUI

@main
struct ReveilApp: App {
    @State private var auth = AuthStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(auth)
                .preferredColorScheme(.dark)
                .task {
                    auth.bootstrap()
                }
        }
    }
}
