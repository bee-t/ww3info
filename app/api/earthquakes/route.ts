import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'earthquakes.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    const data = JSON.parse(fileContents)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error reading earthquakes:', error)
    return NextResponse.json({ earthquakes: [], cached: true, timestamp: new Date().toISOString() }, { status: 200 })
  }
}
