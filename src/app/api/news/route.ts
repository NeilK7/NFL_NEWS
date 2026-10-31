import { NextResponse } from 'next/server';
import { NewsArticle } from '@/types';

export const dynamic = 'force-dynamic';

const FALLBACK_ARTICLES: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Davante Adams Reunited With Aaron Rodgers in Blockbuster Jets Trade',
    summary:
      'The New York Jets acquired three-time All-Pro receiver Davante Adams from the Las Vegas Raiders for a conditional third-round pick, reuniting him with former Packers MVP quarterback Aaron Rodgers.',
    source: 'Yahoo Sports',
    author: 'Jori Epstein',
    publishedAt: 'Recent',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60',
    url: 'https://sports.yahoo.com/nfl',
    tags: ['Jets', 'Trade', 'Aaron Rodgers', 'Davante Adams'],
    teamId: 'nyj',
  },
  {
    id: 'news-2',
    title: 'Super Bowl LVIII Rematch: 49ers and Chiefs Clash in Heavyweight Showdown',
    summary:
      'Kansas City and San Francisco square off in a high-stakes rematch as Patrick Mahomes and Brock Purdy headline the afternoon slate.',
    source: 'ESPN',
    author: 'Nick Wagoner',
    publishedAt: 'Recent',
    imageUrl: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&auto=format&fit=crop&q=60',
    url: 'https://www.espn.com/nfl',
    tags: ['Chiefs', '49ers', 'Matchup'],
    teamId: 'kc',
  },
];

async function fetchYahooSportsRSS(): Promise<NewsArticle[]> {
  try {
    const res = await fetch('https://sports.yahoo.com/nfl/rss.xml', {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    const yahooArticles: NewsArticle[] = [];

    for (let i = 0; i < Math.min(items.length, 10); i++) {
      const item = items[i];
      const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
      const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
      const pubMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const mediaMatch = item.match(/<media:content[^>]*url="([^"]+)"/);
      const descMatch = item.match(
        /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/
      );

      const title = (titleMatch?.[1] || titleMatch?.[2] || '')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();
      const url = (linkMatch?.[1] || 'https://sports.yahoo.com/nfl').trim();
      const rawDesc = (descMatch?.[1] || descMatch?.[2] || '')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();

      if (title) {
        yahooArticles.push({
          id: `yahoo-live-${i}`,
          title,
          summary: rawDesc || `Live NFL report ingested by Fireworks AI from Yahoo Sports: ${title}`,
          source: 'Yahoo Sports',
          author: 'Yahoo Sports NFL Desk',
          publishedAt: pubMatch?.[1]
            ? new Date(pubMatch[1]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Live Wire',
          imageUrl:
            mediaMatch?.[1] ||
            'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60',
          url,
          tags: ['Yahoo Sports', 'NFL Wire'],
          teamTag: 'Yahoo NFL',
        });
      }
    }
    return yahooArticles;
  } catch {
    return [];
  }
}

async function fetchESPNNews(): Promise<NewsArticle[]> {
  try {
    const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/news', {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.articles || !Array.isArray(data.articles)) return [];

    return data.articles.slice(0, 10).map((item: Record<string, any>, idx: number) => ({
      id: `espn-live-${item.id || idx}`,
      title: item.headline || item.title || 'Breaking NFL News',
      summary: item.description || item.story || 'Live breaking report from the ESPN NFL newsdesk.',
      source: 'ESPN' as const,
      author: item.byline || 'ESPN Staff',
      publishedAt: item.published
        ? new Date(item.published).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Live',
      imageUrl:
        item.images?.[0]?.url ||
        'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&auto=format&fit=crop&q=60',
      url: item.links?.web?.href || 'https://www.espn.com/nfl',
      tags: ['ESPN', 'Breaking'],
      teamTag: 'ESPN NFL',
    }));
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team');

    const [yahooArticles, espnArticles] = await Promise.all([
      fetchYahooSportsRSS(),
      fetchESPNNews(),
    ]);

    // Interleave Yahoo Sports and ESPN live articles
    const combined: NewsArticle[] = [];
    const maxLen = Math.max(yahooArticles.length, espnArticles.length);
    for (let i = 0; i < maxLen; i++) {
      if (yahooArticles[i]) combined.push(yahooArticles[i]);
      if (espnArticles[i]) combined.push(espnArticles[i]);
    }

    let articles = combined.length > 0 ? combined : FALLBACK_ARTICLES;

    if (team) {
      articles = articles.filter(
        (a) =>
          a.teamId?.toLowerCase() === team.toLowerCase() ||
          a.title.toLowerCase().includes(team.toLowerCase()) ||
          a.summary.toLowerCase().includes(team.toLowerCase())
      );
    }

    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ articles: FALLBACK_ARTICLES }, { status: 200 });
  }
}
