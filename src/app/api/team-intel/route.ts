import { NextResponse } from 'next/server';
import { SeasonHighlight } from '@/types';
import { callFireworksAI } from '@/lib/fireworks';

export const dynamic = 'force-dynamic';

interface YouTubeScrapedVideo {
  videoId: string;
  title: string;
  duration: string;
  views: string;
  description: string;
  publishedTime: string;
}

async function fetchRealYouTubeHighlights(teamName: string): Promise<SeasonHighlight[]> {
  try {
    const query = `NFL ${teamName} Game Highlights`;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return [];
    const html = await res.text();
    const match = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
    if (!match || !match[1]) return [];

    const data = JSON.parse(match[1]);
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
        ?.contents?.[0]?.itemSectionRenderer?.contents || [];

    const videos: YouTubeScrapedVideo[] = [];

    for (const item of contents) {
      const vr = item.videoRenderer;
      if (!vr || !vr.videoId) continue;
      // Avoid Rickroll or non-sports videos
      if (vr.videoId === 'dQw4w9WgXcQ') continue;

      const title = vr.title?.runs?.map((r: { text: string }) => r.text).join('') || '';
      const duration = vr.lengthText?.simpleText || 'LIVE / Highlight';
      const views = vr.viewCountText?.simpleText || vr.shortViewCountText?.simpleText || 'NFL Official';
      const description =
        vr.detailedMetadataSnippets?.[0]?.snippetText?.runs
          ?.map((r: { text: string }) => r.text)
          .join('') || `Official NFL highlight reel featuring the ${teamName}.`;
      const publishedTime = vr.publishedTimeText?.simpleText || '2024-25 Season';

      if (title) {
        videos.push({
          videoId: vr.videoId,
          title,
          duration,
          views,
          description,
          publishedTime,
        });
      }
      if (videos.length >= 6) break;
    }

    return videos.map((v, idx) => ({
      id: `yt-${v.videoId}-${idx}`,
      title: v.title,
      week: idx + 1,
      duration: v.duration,
      thumbnailUrl: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
      videoUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
      description: v.description,
      views: v.views,
      opponent: v.publishedTime,
    }));
  } catch (err) {
    console.warn('YouTube highlight scrape error:', err);
    return [];
  }
}

async function fetchESPNDirectVideos(teamName: string, teamAbbr: string): Promise<SeasonHighlight[]> {
  const highlights: SeasonHighlight[] = [];
  try {
    const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const events = data?.events || [];

    const allClips: SeasonHighlight[] = [];
    for (const ev of events) {
      const comp = ev.competitions?.[0];
      const headlines = comp?.headlines || [];
      const isTeamMatch =
        ev.name?.toLowerCase().includes(teamName.toLowerCase()) ||
        ev.shortName?.toLowerCase().includes(teamAbbr.toLowerCase());

      for (const hl of headlines) {
        const vid = hl.video?.[0];
        const mp4Url =
          vid?.links?.source?.HD?.href ||
          vid?.links?.source?.full?.href ||
          vid?.links?.source?.href;
        if (mp4Url) {
          const item: SeasonHighlight = {
            id: `espn-vid-${vid.id || Math.random()}`,
            title: vid.headline || hl.shortLinkText || ev.name || 'NFL Game Highlight',
            week: data?.week?.number || 1,
            duration: vid.duration ? `${Math.floor(vid.duration / 60)}:${String(vid.duration % 60).padStart(2, '0')}` : '1:30',
            thumbnailUrl:
              vid.thumbnail ||
              'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&auto=format&fit=crop&q=60',
            videoUrl: mp4Url,
            description: vid.description || hl.description || `Official ESPN broadcast highlight from ${ev.name}.`,
            views: 'ESPN HD Feed',
            opponent: ev.shortName || 'NFL Broadcast',
          };
          if (isTeamMatch) {
            highlights.push(item);
          } else {
            allClips.push(item);
          }
        }
      }
    }

    return highlights.length > 0 ? highlights : allClips.slice(0, 3);
  } catch {
    return [];
  }
}

async function fetchYahooRSSHeadlines(teamName: string): Promise<string[]> {
  try {
    const res = await fetch('https://sports.yahoo.com/nfl/rss.xml', {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    const allTitles: string[] = [];
    const teamTitles: string[] = [];

    const parts = teamName.toLowerCase().split(' ');
    for (const item of items.slice(0, 25)) {
      const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
      const rawTitle = (titleMatch?.[1] || titleMatch?.[2] || '').trim();
      if (rawTitle) {
        allTitles.push(rawTitle);
        if (parts.some((p) => p.length > 2 && rawTitle.toLowerCase().includes(p))) {
          teamTitles.push(rawTitle);
        }
      }
    }
    return teamTitles.length > 0 ? teamTitles : allTitles.slice(0, 6);
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamName = searchParams.get('teamName') || 'Kansas City Chiefs';
  const teamAbbr = searchParams.get('teamAbbr') || 'KC';

  const [espnVideos, ytVideos, yahooHeadlines] = await Promise.all([
    fetchESPNDirectVideos(teamName, teamAbbr),
    fetchRealYouTubeHighlights(teamName),
    fetchYahooRSSHeadlines(teamName),
  ]);

  // Combine ESPN direct MP4 clips + real YouTube highlights
  const combinedHighlights: SeasonHighlight[] = [...espnVideos, ...ytVideos].slice(0, 6);

  // Use Fireworks AI (from ruminate setup) to synthesize live team intelligence
  let aiReport = {
    headline: `${teamName} Live Fireworks AI War Room Brief`,
    summary: `Real-time intelligence gathered for the ${teamName} from Yahoo Sports and ESPN wire feeds.`,
    bulletPoints: yahooHeadlines.slice(0, 3),
    poweredBy: 'Fireworks AI (DeepSeek)',
  };

  if (yahooHeadlines.length > 0 || combinedHighlights.length > 0) {
    const promptContext = [
      `Team: ${teamName} (${teamAbbr})`,
      `Latest Yahoo Sports NFL Headlines: ${yahooHeadlines.slice(0, 5).join(' | ')}`,
      `Latest Highlight Videos Imported: ${combinedHighlights.map((h) => h.title).join(' | ')}`,
    ].join('\n');

    const aiResponse = await callFireworksAI([
      {
        role: 'system',
        content:
          'You are Gridiron Apex AI, an elite NFL scouting and news intelligence engine powered by Fireworks AI. Respond ONLY in valid JSON with keys: "headline" (string), "summary" (2-3 sentence insider overview of the team right now), and "bulletPoints" (array of 3 concise tactical takeaways).',
      },
      {
        role: 'user',
        content: `Synthesize this live gathered NFL data for the ${teamName}:\n${promptContext}`,
      },
    ]);

    if (aiResponse) {
      try {
        const cleaned = aiResponse.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.summary) {
          aiReport = {
            headline: parsed.headline || `${teamName} Live Fireworks AI Intelligence`,
            summary: parsed.summary,
            bulletPoints: Array.isArray(parsed.bulletPoints)
              ? parsed.bulletPoints.slice(0, 3)
              : yahooHeadlines.slice(0, 3),
            poweredBy: 'Fireworks AI (DeepSeek)',
          };
        }
      } catch {
        aiReport.summary = aiResponse.replace(/```json|```/g, '').slice(0, 360);
      }
    }
  }

  return NextResponse.json({
    highlights: combinedHighlights,
    aiReport,
    yahooHeadlines: yahooHeadlines.slice(0, 5),
  });
}
