// Imgur Image Upload API
// Handles clipboard image paste → Imgur upload → URL return

import { NextRequest, NextResponse } from 'next/server'

interface ImgurResponse {
  data: {
    link: string
    deletehash: string
    id: string
  }
  success: boolean
  status: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, type = 'base64' } = body

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Get Imgur client ID from env
    const clientId = process.env.IMGUR_CLIENT_ID
    if (!clientId) {
      // Fallback: return placeholder for development
      console.warn('IMGUR_CLIENT_ID not set, using placeholder')
      return NextResponse.json({
        success: true,
        link: `https://placehold.co/800x600/1a1a2e/ffffff?text=Image+Upload`,
        id: `placeholder-${Date.now()}`,
      })
    }

    // Upload to Imgur
    const formData = new FormData()
    formData.append('image', image)
    formData.append('type', type)

    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${clientId}`,
      },
      body: formData,
    })

    const result: ImgurResponse = await response.json()

    if (!result.success) {
      console.error('Imgur upload failed:', result)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      link: result.data.link,
      deleteHash: result.data.deletehash,
      id: result.data.id,
    })
  } catch (error) {
    console.error('Imgur upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
