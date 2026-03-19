'use client'

import { useState, useEffect } from 'react'

export default function VerifyPage() {
  const [status, setStatus] = useState<'pending' | 'verifying' | 'verified' | 'error'>('pending')
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null)

  const startVerification = async () => {
    setStatus('verifying')
    
    try {
      const res = await fetch('/api/age', { method: 'POST' })
      const data = await res.json()
      
      if (data.verification_url) {
        setVerificationUrl(data.verification_url)
        // Open k-ID verification in popup or redirect
        window.open(data.verification_url, 'age-verification', 'width=500,height=700')
      }
    } catch (error) {
      setStatus('error')
    }
  }

  // Poll for verification status
  useEffect(() => {
    if (status !== 'verifying') return
    
    const interval = setInterval(async () => {
      const res = await fetch('/api/age')
      const data = await res.json()
      
      if (data.ageVerified) {
        setStatus('verified')
        clearInterval(interval)
        setTimeout(() => {
          window.location.href = '/chat'
        }, 2000)
      }
    }, 3000)
    
    return () => clearInterval(interval)
  }, [status])

  if (status === 'verified') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl p-8 text-white shadow-xl">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">✓</div>
            <h1 className="text-2xl font-bold mb-2">Age Verified!</h1>
            <p className="opacity-90">Redirecting to chat...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold">Age Verification Required</h1>
          <p className="text-gray-600 mt-2">
            To use GirlyPopChat, you must verify that you're 18 or older.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
          <div className="bg-pink-50 rounded-xl p-4">
            <h3 className="font-semibold text-pink-700 mb-2">🔒 Privacy First</h3>
            <p className="text-sm text-pink-600">
              We use AgeKey for verification. Your exact age is never shared—only that you're 18+.
              Verification costs less than $0.01 and is reusable across other platforms.
            </p>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <p><strong>How it works:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Verify My Age"</li>
              <li>Choose a verification method (ID, face scan, or existing AgeKey)</li>
              <li>Get instant access to GirlyPopChat</li>
            </ol>
          </div>

          {status === 'pending' && (
            <button
              onClick={startVerification}
              className="w-full py-3 gradient-bg text-white rounded-lg font-medium hover:opacity-90 transition"
            >
              Verify My Age →
            </button>
          )}

          {status === 'verifying' && (
            <div className="text-center py-4">
              <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-gray-600">Waiting for verification...</p>
              <p className="text-sm text-gray-500 mt-1">Complete the popup window to continue</p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
              Verification failed. Please try again.
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Powered by <a href="https://openageinitiative.org" className="underline">OpenAge</a> / k-ID
        </p>
      </div>
    </main>
  )
}
