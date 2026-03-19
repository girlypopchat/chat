export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-16 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 2025</p>

        <section className="space-y-6 text-gray-700">
          <div>
            <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
            <p>We collect information you provide when creating an account, including your name, email address, and profile information obtained through OAuth providers (Google, Discord, Apple).</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">2. How We Use Your Information</h2>
            <p>We use your information to operate GirlyPopChat, authenticate your identity, provide chat and broadcast features, and ensure community safety.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">3. Data Sharing</h2>
            <p>We do not sell your personal data. We use Stytch for authentication and LiveKit for video/audio features. These services may process your data per their own privacy policies.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">4. Age Requirement</h2>
            <p>GirlyPopChat is strictly 18+. We use age verification to enforce this requirement. If we discover a user is under 18, their account will be immediately terminated.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">5. Data Retention</h2>
            <p>You may request deletion of your account and associated data at any time by contacting us.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">6. Contact</h2>
            <p>For privacy-related questions, contact us at <a href="mailto:hello@girlypopchat.com" className="text-pink-500 underline">hello@girlypopchat.com</a>.</p>
          </div>
        </section>

        <div className="mt-8 pt-6 border-t">
          <a href="/" className="text-pink-500 hover:underline">← Back to GirlyPopChat</a>
        </div>
      </div>
    </main>
  )
}
