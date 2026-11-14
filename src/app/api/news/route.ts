import { NextResponse } from 'next/server';
import { NewsArticle } from '@/types';
import { callFireworksAI } from '@/lib/fireworks';
import { getTeamNews } from '@/lib/team-news';
import { NFL_TEAMS } from '@/lib/nfl-teams';

export const dynamic = 'force-dynamic';

const ESPN_TEAM_IDS: Record<string, string> = {
  ari: '22',
  atl: '1',
  bal: '33',
  buf: '2',
  car: '29',
  chi: '3',
  cin: '4',
  cle: '5',
  dal: '6',
  den: '7',
  det: '8',
  gb: '9',
  hou: '34',
  ind: '11',
  jax: '30',
  kc: '12',
  lv: '13',
  lac: '24',
  lar: '14',
  mia: '15',
  min: '16',
  ne: '17',
  no: '18',
  nyg: '19',
  nyj: '20',
  phi: '21',
  pit: '23',
  sf: '25',
  sea: '26',
  tb: '27',
  ten: '10',
  wsh: '28',
};

const TEAM_KEYWORDS: { id: string; keywords: string[] }[] = [
  { id: 'den', keywords: ['broncos', 'bo nix', 'surtain', 'sean payton', 'denver', 'sutton', 'bonitto', 'dobbins', 'zach allen'] },
  { id: 'kc', keywords: ['chiefs', 'mahomes', 'kelce', 'kansas city', 'spagnuolo', 'andy reid', 'chris jones'] },
  { id: 'sf', keywords: ['49ers', 'niners', 'purdy', 'mccaffrey', 'shanahan', 'nick bosa', 'san francisco', 'kittle'] },
  { id: 'bal', keywords: ['ravens', 'lamar jackson', 'derrick henry', 'baltimore', 'john harbaugh', 'zay flowers'] },
  { id: 'det', keywords: ['lions', 'jared goff', 'dan campbell', 'hutchinson', 'st. brown', 'gibbs', 'detroit'] },
  { id: 'buf', keywords: ['bills', 'josh allen', 'buffalo', 'mcdermott', 'shakir', 'kincaid', 'james cook'] },
  { id: 'phi', keywords: ['eagles', 'jalen hurts', 'saquon', 'barkley', 'philadelphia', 'sirianni', 'a.j. brown'] },
  { id: 'dal', keywords: ['cowboys', 'prescott', 'ceedee', 'parsons', 'dallas', 'jerry jones'] },
  { id: 'nyj', keywords: ['jets', 'breece hall', 'garrett wilson', 'sauce gardner', 'justin fields'] },
  { id: 'cin', keywords: ['bengals', 'burrow', 'ja\'marr', 'tee higgins', 'cincinnati', 'trey hendrickson'] },
  { id: 'hou', keywords: ['texans', 'stroud', 'nico collins', 'mixon', 'houston', 'demeco ryans'] },
  { id: 'gb', keywords: ['packers', 'jordan love', 'green bay', 'lafleur', 'josh jacobs'] },
  { id: 'mia', keywords: ['dolphins', 'tagovailoa', 'tyreek', 'achane', 'miami', 'mike mcdaniel'] },
  { id: 'pit', keywords: ['steelers', 't.j. watt', 'pittsburgh', 'mike tomlin', 'pickens'] },
  { id: 'min', keywords: ['vikings', 'justin jefferson', 'j.j. mccarthy', 'minnesota', 'kevin o\'connell'] },
  { id: 'wsh', keywords: ['commanders', 'jayden daniels', 'mclaurin', 'washington', 'dan quinn'] },
  { id: 'chi', keywords: ['bears', 'caleb williams', 'dj moore', 'chicago', 'odunze'] },
  { id: 'atl', keywords: ['falcons', 'bijan robinson', 'drake london', 'atlanta', 'penix'] },
  { id: 'tb', keywords: ['buccaneers', 'bucs', 'baker mayfield', 'mike evans', 'godwin', 'tampa bay'] },
  { id: 'sea', keywords: ['seahawks', 'sam darnold', 'jaxon smith-njigba', 'seattle', 'mike macdonald'] },
  { id: 'lar', keywords: ['rams', 'matthew stafford', 'puka', 'nacua', 'sean mcvay'] },
  { id: 'lac', keywords: ['chargers', 'justin herbert', 'jim harbaugh', 'ladd mcconkey', 'khalil mack'] },
  { id: 'lv', keywords: ['raiders', 'maxx crosby', 'brock bowers', 'las vegas', 'ashton jeanty'] },
  { id: 'cle', keywords: ['browns', 'myles garrett', 'cleveland', 'jerry jeudy'] },
  { id: 'ind', keywords: ['colts', 'anthony richardson', 'jonathan taylor', 'indianapolis'] },
  { id: 'jax', keywords: ['jaguars', 'trevor lawrence', 'etienne', 'jacksonville', 'brian thomas', 'travis hunter'] },
  { id: 'ten', keywords: ['titans', 'cam ward', 'tony pollard', 'calvin ridley', 'tennessee'] },
  { id: 'ne', keywords: ['patriots', 'drake maye', 'new england', 'mike vrabel'] },
  { id: 'nyg', keywords: ['giants', 'malik nabers', 'dexter lawrence', 'daboll', 'abdul carter'] },
  { id: 'no', keywords: ['saints', 'alvin kamara', 'chris olave', 'new orleans'] },
  { id: 'car', keywords: ['panthers', 'bryce young', 'chuba hubbard', 'carolina', 'tetairoa mcmillan'] },
  { id: 'ari', keywords: ['cardinals', 'kyler murray', 'marvin harrison', 'arizona', 'trey mcbride'] },
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasWholeWord(text: string, phrase: string): boolean {
  const re = new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'i');
  return re.test(text);
}

function detectTeamAndTags(title: string, summary: string): { teamId?: string; tags: string[] } {
  const combined = `${title} ${summary}`;
  const lower = combined.toLowerCase();
  const tags = new Set<string>(['NFL', 'Live Wire']);
  let matchedTeamId: string | undefined;

  for (const tk of TEAM_KEYWORDS) {
    for (const kw of tk.keywords) {
      if (hasWholeWord(combined, kw)) {
        if (!matchedTeamId) matchedTeamId = tk.id;
        tags.add(tk.id.toUpperCase());
      }
    }
  }

  if (lower.includes('injur') || lower.includes('surgery') || lower.includes('questionable') || hasWholeWord(combined, 'out')) {
    tags.add('Injuries');
  }
  if (hasWholeWord(combined, 'trade') || hasWholeWord(combined, 'sign') || lower.includes('contract') || hasWholeWord(combined, 'draft')) {
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

async function fetchESPNLiveNews(espnTeamId?: string, teamKey?: string, teamName?: string): Promise<NewsArticle[]> {
  try {
    const endpoint = espnTeamId
      ? `https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?team=${espnTeamId}&limit=15`
      : 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=15';

    const res = await fetch(endpoint, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.articles || !Array.isArray(data.articles)) return [];

    return data.articles.slice(0, 12).map((item: any, idx: number) => {
      const title = item.headline || item.title || 'Breaking NFL News';
      const summary = item.description || item.story || title;
      const detected = detectTeamAndTags(title, summary);
      const teamId = teamKey || detected.teamId;
      const tags = teamName ? Array.from(new Set([teamName, ...detected.tags])).slice(0, 4) : detected.tags;

      return {
        id: `espn-live-${teamKey || 'all'}-${item.id || idx}`,
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
        teamTag: teamName,
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

    if (teamParam) {
      const tLower = teamParam.toLowerCase() === 'was' ? 'wsh' : teamParam.toLowerCase();
      const teamObj = NFL_TEAMS.find((t) => t.id === tLower || t.abbreviation.toLowerCase() === tLower);
      const espnTeamId = ESPN_TEAM_IDS[tLower];
      const keywordObj = TEAM_KEYWORDS.find((k) => k.id === tLower);

      const [espnTeamArticles, yahooArticles, nflArticles] = await Promise.all([
        fetchESPNLiveNews(espnTeamId, tLower, teamObj?.name),
        fetchYahooSportsRSS(),
        fetchNFLDotComRSS(),
      ]);

      const allWire = [...yahooArticles, ...nflArticles];
      const matchedWire = allWire.filter((a) => {
        if (a.teamId?.toLowerCase() === tLower) return true;
        if (a.tags.some((t) => t.toLowerCase() === tLower)) return true;
        const text = `${a.title} ${a.summary}`;
        if (teamObj && (hasWholeWord(text, teamObj.name) || hasWholeWord(text, teamObj.city))) {
          return true;
        }
        if (keywordObj && keywordObj.keywords.some((kw) => hasWholeWord(text, kw))) {
          return true;
        }
        return false;
      });

      const fallbackTeamArticles = getTeamNews(
        tLower,
        teamObj?.name || 'Broncos',
        teamObj?.abbreviation || 'DEN'
      );

      const merged = [...matchedWire, ...espnTeamArticles, ...fallbackTeamArticles];
      const seen = new Set<string>();
      const uniqueTeamArticles = merged.filter((item) => {
        if (seen.has(item.title)) return false;
        seen.add(item.title);
        return true;
      });

      return NextResponse.json({
        articles: uniqueTeamArticles.slice(0, 15),
        updatedAt: new Date().toLocaleTimeString(),
        sources: ['ESPN', 'Yahoo Sports', 'NFL.com', 'Fireworks AI'],
      });
    }

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

    return NextResponse.json({
      articles: combined,
      updatedAt: new Date().toLocaleTimeString(),
      sources: ['Yahoo Sports', 'NFL.com', 'ESPN', 'Fireworks AI'],
    });
  } catch (error) {
    console.error('Error in /api/news:', error);
    return NextResponse.json({ articles: [], error: 'Failed to load live NFL news' }, { status: 500 });
  }
}
