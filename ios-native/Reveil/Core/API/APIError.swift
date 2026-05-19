import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case http(status: Int, body: String)
    case decoding(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .invalidResponse: return "Invalid response from server"
        case .http(let status, let body):
            return body.isEmpty ? "Server error \(status)" : "Server error \(status): \(body)"
        case .decoding(let err): return "Could not parse response: \(err.localizedDescription)"
        }
    }
}

