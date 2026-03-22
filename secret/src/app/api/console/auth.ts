import { NextRequest } from 'next/server'

export function isConsoleAuth(request: NextRequest): boolean {
  const key = request.headers.get('x-console-key')
  return !!process.env.CONSOLE_API_KEY && key === process.env.CONSOLE_API_KEY
}
