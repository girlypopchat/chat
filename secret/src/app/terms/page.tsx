export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-16 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 2025</p>

        <section className="space-y-6 text-gray-700">
          <div>
            <h2 className="text-xl font-semibold mb-2">1. Acceptance</h2>
            <p>By using GirlyPopChat, you agree to these Terms of Service. If you do not agree, do not use the platform.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">2. Age Requirement</h2>
            <p>You must be 18 years of age or older to use GirlyPopChat. By creating an account, you confirm you meet this requirement.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">3. Invite-Only Access</h2>
            <p>GirlyPopChat is an invite-only community. Your access is tied to your invite code and may be revoked at any time for violations of these terms.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">4. Community Rules</h2>
            <p>You agree not to harass, threaten, or harm other users. No illegal content, no impersonation, and no spam. Violations result in immediate account termination.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">5. Content</h2>
            <p>You are responsible for all content you share. GirlyPopChat reserves the right to remove any content that violates these terms or applicable law.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">6. Termination</h2>
            <p>We may suspend or terminate your account at any time for violations of these terms, without notice.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">7. Contact</h2>
            <p>For questions about these terms, contact <a href="mailto:hello@girlypopchat.com" className="text-pink-500 underline">hello@girlypopchat.com</a>.</p>
          </div>
        </section>

        <div className="mt-8 pt-6 border-t">
          <a href="/" className="text-pink-500 hover:underline">← Back to GirlyPopChat</a>
        </div>
      </div>
    </main>
  )
}
