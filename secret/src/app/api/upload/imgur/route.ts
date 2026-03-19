import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, type = 'base64' } = body

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const apiKey = process.env.IMGBB_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        link: `https://placehold.co/800x600/1a1a2e/ffffff?text=Image+Upload`,
        id: `placeholder-${Date.now()}`,
      })
    }

    const formData = new FormData()
    formData.append('image', image)

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!result.success) {
      console.error('ImgBB upload failed:', result)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      link: result.data.url,
      id: result.data.id,
    })
  } catch (error) {
    console.error('ImgBB upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
