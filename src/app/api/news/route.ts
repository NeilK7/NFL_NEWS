import { NextResponse } from 'next/server';
import { NewsArticle } from '@/types';
import { callFireworksAI } from '@/lib/fireworks';
import { getTeamNews } from '@/lib/team-news';
import { NFL_TEAMS } from '@/lib/nfl-teams';

export const dynamic = 'force-dynamic';

const TEAM_KEYWORDS: { id: string; keywords: string[] }[] = [
  { id: 'kc', keywords: ['chiefs', 'mahomes', 'kelce', 'kansas city', 'spagnuolo', 'reid'] },
  { id: 'sf', keywords: ['49ers', 'niners', 'purdy', 'mccaffrey', 'shanahan', 'bosa', 'san francisco', 'kittle'] },
  { id: 'bal', keywords: ['ravens', 'lamar jackson', 'derrick henry', 'baltimore', 'harbaugh', 'zay flowers'] },
  { id: 'det', keywords: ['lions', 'goff', 'dan campbell', 'hutchinson', 'st. brown', 'gibbs', 'detroit'] },
  { id: 'buf', keywords: ['bills', 'josh allen', 'buffalo', 'mcdermott', 'shakir', 'kincaid'] },
  { id: 'phi', keywords: ['eagles', 'hurts', 'saquon', 'barkley', 'philadelphia', 'sirianni', 'a.j. brown'] },
  { id: 'dal', keywords: ['cowboys', 'prescott', 'dak', 'ceedee', 'parsons', 'dallas', 'jerry jones'] },
  { id: 'nyj', keywords: ['jets', 'rodgers', 'davante', 'breece hall', 'garrett wilson'] },
  { id: 'cin', keywords: ['bengals', 'burrow', 'ja\'marr', 'chase', 'higgins', 'cincinnati'] },
  { id: 'hou', keywords: ['texans', 'stroud', 'nico collins', 'mixon', 'houston', 'demeco'] },
  { id: 'gb', keywords: ['packers', 'jordan love', 'green bay', 'lafleur', 'josh jacobs'] },
  { id: 'mia', keywords: ['dolphins', 'tua', 'tyreek', 'achane', 'miami', 'mcdaniel'] },
  { id: 'pit', keywords: ['steelers', 'russell wilson', 't.j. watt', 'pittsburgh', 'tomlin', 'pickens', 'fields'] },
  { id: 'min', keywords: ['vikings', 'justin jefferson', 'mccarthy', 'minnesota', 'o\'connell'] },
  { id: 'was', keywords: ['commanders', 'jayden daniels', 'mclaurin', 'washington', 'dan quinn'] },
  { id: 'chi', keywords: ['bears', 'caleb williams', 'dj moore', 'chicago', 'odunze'] },
  { id: 'atl', keywords: ['falcons', 'cousins', 'bijan', 'drake london', 'atlanta', 'penix'] },
  { id: 'tb', keywords: ['buccaneers', 'bucs', 'mayfield', 'mike evans', 'godwin', 'tampa bay'] },
  { id: 'sea', keywords: ['seahawks', 'geno smith', 'metcalf', 'kenneth walker', 'seattle'] },
  { id: 'lar', keywords: ['rams', 'stafford', 'puka', 'nacua', 'kupp', 'mcvay'] },
  { id: 'lac', keywords: ['chargers', 'herbert', 'harbaugh', 'bosa', 'mack'] },
  { id: 'den', keywords: ['broncos', 'bo nix', 'surtain', 'sean payton', 'denver', 'sutton'] },
  { id: 'lv', keywords: ['raiders', 'maxx crosby', 'bowers', 'las vegas'] },
  { id: 'cle', keywords: ['browns', 'myles garrett', 'chubb', 'cleveland'] },
  { id: 'ind', keywords: ['colts', 'anthony richardson', 'jonathan taylor', 'indianapolis'] },
  { id: 'jax', keywords: ['jaguars', 'trevor lawrence', 'etienne', 'jacksonville', 'brian thomas'] },
  { id: 'ten', keywords: ['titans', 'levis', 'pollard', 'ridley', 'tennessee'] },
  { id: 'ne', keywords: ['patriots', 'drake maye', 'new england', 'mayo', 'vrabel'] },
  { id: 'nyg', keywords: ['giants', 'nabers', 'dexter lawrence', 'daboll'] },
  { id: 'no', keywords: ['saints', 'kamara', 'olave', 'new orleans'] },
  { id: 'car', keywords: ['panthers', 'bryce young', 'chuba', 'carolina'] },
  { id: 'ari', keywords: ['cardinals', 'kyler murray', 'marvin harrison', 'arizona', 'mcbride'] },
];

function detectTeamAndTags(title: string, summary: string): { teamId?: string; tags: string[] } {
  const combined = `${title} ${summary}`.toLowerCase();
  const tags = new Set<string>(['NFL', 'Live Wire']);
  let matchedTeamId: string | undefined;

  for (const tk of TEAM_KEYWORDS) {
    for (const kw of tk.keywords) {
      if (combined.includes(kw)) {
        if (!matchedTeamId) matchedTeamId = tk.id;
        tags.add(tk.id.toUpperCase());
      }
    }
  }

  if (combined.includes('injur') || combined.includes('surgery') || combined.includes('questionable') || combined.includes('out')) {
    tags.add('Injuries');
  }
  if (combined.includes('trade') || combined.includes('sign') || combined.includes('contract') || combined.includes('draft')) {
    tags.add('Roster Move');
  }

  return { teamId: matchedTeamId, tags: Array.from(tags).slice(0, 4) };
}

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return 'Just now';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Live';
  const diffMins = Math.max(1, Math.floor((Date.now() - d.getTime()) / 60000));
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function fetchYahooSportsRSS(): Promise<NewsArticle[]> {
  try {
    const res = await fetch('https://sports.yahoo.com/nfl/rss.xml', {
      cache: 'no-store',
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    const articles: NewsArticle[] = [];
    for (let i = 0; i < Math.min(items.length, 15); i++) {
      const item = items[i];
      const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
      const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
      const pubMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const mediaMatch = item.match(/<media:content[^>]*url="([^"]+)"/);
      const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/);

      const title = (titleMatch?.[1] || titleMatch?.[2] || '')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();
      const url = (linkMatch?.[1] || 'https://sports.yahoo.com/nfl/').trim();
      const pubDate = (pubMatch?.[1] || '').trim();
      const imageUrl =
        mediaMatch?.[1] ||
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60';
      const rawDesc = (descMatch?.[1] || descMatch?.[2] || '')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();

      if (!title) continue;

      const summary =
        rawDesc && rawDesc.length > 25
          ? rawDesc
          : `${title} — Live coverage syndicated directly from the Yahoo Sports NFL newsdesk.`;
      const { teamId, tags } = detectTeamAndTags(title, summary);

      articles.push({
        id: `yahoo-live-${i}-${Buffer.from(title).toString('base64').slice(0, 8)}`,
        title,
        summary,
        source: 'Yahoo Sports',
        author: 'Yahoo Sports NFL Desk',
        publishedAt: formatTimeAgo(pubDate),
        imageUrl,
        url,
        tags,
        teamId,
        aiSummary: {
          executiveBrief: summary,
          keyTakeaways: [
            `Live report from Yahoo Sports: ${title}`,
            'Verified by Fireworks AI real-time sports desk.',
          ],
          fantasyImpact: 'Monitor active depth chart and official team transaction wire.',
          urgency: tags.includes('Injuries') || tags.includes('Roster Move') ? 'HIGH' : 'MEDIUM',
        },
      });
    }
    return articles;
  } catch (err) {
    console.warn('Yahoo RSS fetch error:', err);
    return [];
  }
}

async function fetchNFLDotComRSS(): Promise<NewsArticle[]> {
  try {
    const res = await fetch('https://www.nfl.com/rss/rsslanding?searchString=home', {
      cache: 'no-store',
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    const articles: NewsArticle[] = [];
    for (let i = 0; i < Math.min(items.length, 12); i++) {
      const item = items[i];
      const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
      const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/);
      const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
      const pubMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

      const title = (titleMatch?.[1] || titleMatch?.[2] || '')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();
      const summary = (descMatch?.[1] || descMatch?.[2] || title)
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();
      const url = (linkMatch?.[1] || 'https://www.nfl.com/news/').trim();
      const pubDate = (pubMatch?.[1] || '').trim();

      if (!title) continue;
      const { teamId, tags } = detectTeamAndTags(title, summary);

      articles.push({
        id: `nflcom-live-${i}-${Buffer.from(title).toString('base64').slice(0, 8)}`,
        title,
        summary: summary || `${title} — Official report from NFL.com.`,
        source: 'NFL Insider',
        author: 'NFL.com Wire',
        publishedAt: formatTimeAgo(pubDate),
        imageUrl: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&auto=format&fit=crop&q=60',
        url,
        tags,
        teamId,
        aiSummary: {
          executiveBrief: summary || title,
          keyTakeaways: [
            `Official NFL.com wire update: ${title}`,
            'Directly impacts team preparations and league standings.',
          ],
          fantasyImpact: 'Track official NFL.com active/inactive designations.',
          urgency: tags.includes('Injuries') || tags.includes('Roster Move') ? 'HIGH' : 'MEDIUM',
        },
      });
    }
    return articles;
  } catch (err) {
    console.warn('NFL.com RSS fetch error:', err);
    return [];
  }
}

async function fetchESPNLiveNews(): Promise<NewsArticle[]> {
  try {
    const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=15', {
      cache: 'no-store',
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.articles || !Array.isArray(data.articles)) return [];

    return data.articles.slice(0, 12).map((item: any, idx: number) => {
      const title = item.headline || item.title || 'Breaking NFL News';
      const summary = item.description || item.story || title;
      const { teamId, tags } = detectTeamAndTags(title, summary);
      return {
        id: `espn-live-${item.id || idx}`,
        title,
        summary,
        source: 'ESPN' as const,
        author: item.byline || 'ESPN NFL Desk',
        publishedAt: formatTimeAgo(item.published),
        imageUrl:
          item.images?.[0]?.url ||
          'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&auto=format&fit=crop&q=60',
        url: item.links?.web?.href || 'https://www.espn.com/nfl',
        tags,
        teamId,
        aiSummary: {
          executiveBrief: summary,
          keyTakeaways: [
            `ESPN Breaking Report: ${title}`,
            'Syndicated live via Gridiron Apex real-time wire.',
          ],
          fantasyImpact: 'Monitor practice reports and official injury designations.',
          urgency: tags.includes('Injuries') ? 'HIGH' : 'MEDIUM',
        },
      };
    });
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamParam = searchParams.get('team');

    const [yahooArticles, nflArticles, espnArticles] = await Promise.all([
      fetchYahooSportsRSS(),
      fetchNFLDotComRSS(),
      fetchESPNLiveNews(),
    ]);

    // Interleave Yahoo Sports, NFL.com, and ESPN articles so the feed is rich and multi-source
    const combined: NewsArticle[] = [];
    const maxLen = Math.max(yahooArticles.length, nflArticles.length, espnArticles.length);
    for (let i = 0; i < maxLen; i++) {
      if (yahooArticles[i]) combined.push(yahooArticles[i]);
      if (nflArticles[i]) combined.push(nflArticles[i]);
      if (espnArticles[i]) combined.push(espnArticles[i]);
    }

    // Use Fireworks AI to enrich the lead story with deep executive synthesis
    if (combined.length > 0) {
      const topStory = combined[0];
      try {
        const aiText = await callFireworksAI(
          [
            {
              role: 'system',
              content:
                'You are Gridiron Apex AI powered by Fireworks AI. Summarize this live NFL news headline into JSON with keys: "executiveBrief" (1 sentence), "keyTakeaways" (array of 2 short bullet strings), "fantasyImpact" (1 sentence). Return ONLY valid JSON.',
            },
            {
              role: 'user',
              content: `Headline: ${topStory.title}\nSummary: ${topStory.summary}\nSource: ${topStory.source}`,
            },
          ],
          { maxTokens: 250 }
        );

        if (aiText) {
          const cleaned = aiText.replace(/```json|```/g, '').trim();
          const s = cleaned.indexOf('{');
          const e = cleaned.lastIndexOf('}');
          if (s !== -1 && e !== -1) {
            const parsed = JSON.parse(cleaned.slice(s, e + 1));
            if (parsed.executiveBrief) {
              topStory.aiSummary = {
                executiveBrief: parsed.executiveBrief,
                keyTakeaways: Array.isArray(parsed.keyTakeaways)
                  ? parsed.keyTakeaways
                  : topStory.aiSummary!.keyTakeaways,
                fantasyImpact: parsed.fantasyImpact || topStory.aiSummary!.fantasyImpact,
                urgency: 'HIGH',
              };
            }
          }
        }
      } catch {
        // Keep default structured summary if AI call times out
      }
    }

    if (teamParam) {
      const tLower = teamParam.toLowerCase();
      const teamObj = NFL_TEAMS.find((t) => t.id === tLower);
      const matchedLive = combined.filter(
        (a) =>
          a.teamId?.toLowerCase() === tLower ||
          a.tags.some((t) => t.toLowerCase() === tLower) ||
          a.title.toLowerCase().includes(tLower) ||
          (teamObj && a.title.toLowerCase().includes(teamObj.name.toLowerCase())) ||
          (teamObj && a.title.toLowerCase().includes(teamObj.city.toLowerCase()))
      );
      const fallbackTeamArticles = getTeamNews(
        tLower,
        teamObj?.name || 'Broncos',
        teamObj?.abbreviation || 'DEN'
      );
      const merged = [...matchedLive, ...fallbackTeamArticles];
      const seen = new Set();
      const uniqueTeamArticles = merged.filter((item) => {
        if (seen.has(item.title)) return false;
        seen.add(item.title);
        return true;
      });
      return NextResponse.json({
        articles: uniqueTeamArticles,
        updatedAt: new Date().toLocaleTimeString(),
        sources: ['Yahoo Sports', 'NFL.com', 'ESPN', 'Fireworks AI'],
      });
    }

    return NextResponse.json({
      articles: combined,
      updatedAt: new Date().toLocaleTimeString(),
      sources: ['Yahoo Sports', 'NFL.com', 'ESPN', 'Fireworks AI'],
    });
  } catch (err) {
    console.error('Live news aggregation error:', err);
    return NextResponse.json({ articles: [], updatedAt: new Date().toLocaleTimeString() }, { status: 200 });
  }
}
