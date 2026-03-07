import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const API_KEY = 'uFnC8YPPYeXXToK4re8kRXdl2kkMmGTcjkwo0xNjTo_VerF5';
const RATE_LIMIT_FILE = path.join(process.cwd(), '.rate-limit.json');
const MAX_CALLS_PER_DAY = 20;

interface RateLimitData {
  date: string;
  count: number;
  lastFetch?: {
    timestamp: string;
    data: any;
  };
}

async function getRateLimitData(): Promise<RateLimitData> {
  try {
    const data = await fs.readFile(RATE_LIMIT_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { date: new Date().toISOString().split('T')[0], count: 0 };
  }
}

async function saveRateLimitData(data: RateLimitData): Promise<void> {
  await fs.writeFile(RATE_LIMIT_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    let rateLimitData = await getRateLimitData();

    // Reset counter if it's a new day
    if (rateLimitData.date !== today) {
      rateLimitData = { date: today, count: 0 };
    }

    // Check if we have cached data from within the last hour
    if (rateLimitData.lastFetch) {
      const lastFetchTime = new Date(rateLimitData.lastFetch.timestamp).getTime();
      const now = Date.now();
      const hourInMs = 60 * 60 * 1000;
      
      if (now - lastFetchTime < hourInMs) {
        return NextResponse.json({
          ...rateLimitData.lastFetch.data,
          cached: true,
          callsRemaining: MAX_CALLS_PER_DAY - rateLimitData.count,
        });
      }
    }

    // Check rate limit
    if (rateLimitData.count >= MAX_CALLS_PER_DAY) {
      return NextResponse.json(
        {
          error: 'Daily rate limit reached',
          callsRemaining: 0,
          resetTime: new Date(today).getTime() + 24 * 60 * 60 * 1000,
          cached: rateLimitData.lastFetch ? true : false,
          data: rateLimitData.lastFetch?.data || null,
        },
        { status: 429 }
      );
    }

    // Fetch from CurrentsAPI - searching for conflict-related news
    // Use latest-news endpoint with politics category for better results
    const url = `https://api.currentsapi.services/v1/latest-news?language=en&category=politics&apiKey=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch news');
    }

    // Increment counter and cache the data
    rateLimitData.count += 1;
    rateLimitData.lastFetch = {
      timestamp: new Date().toISOString(),
      data: {
        news: data.news || [],
        status: data.status,
      },
    };

    await saveRateLimitData(rateLimitData);

    return NextResponse.json({
      news: data.news || [],
      status: data.status,
      cached: false,
      callsRemaining: MAX_CALLS_PER_DAY - rateLimitData.count,
      lastUpdated: rateLimitData.lastFetch.timestamp,
    });
  } catch (error: any) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch news data', news: [] },
      { status: 500 }
    );
  }
}
