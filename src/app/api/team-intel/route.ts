import { NextResponse } from 'next/server';
import { SeasonHighlight, GameSchedule, Injury } from '@/types';
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

async function fetchLiveTeamScheduleAndRecord(teamAbbr: string) {
  const abbr = teamAbbr.toLowerCase();
  try {
    const [teamRes, schedRes] = await Promise.all([
      fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${abbr}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${abbr}/schedule`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    let record = { wins: 0, losses: 0, ties: 0, summary: '' };
    let rankInDivision = '';

    if (teamRes.ok) {
      const teamData = await teamRes.json();
      const t = teamData?.team;
      rankInDivision = t?.standingSummary || '';
      const recItem = t?.record?.items?.find((i: any) => i.type === 'total') || t?.record?.items?.[0];
      if (recItem) {
        record.summary = recItem.summary || '';
        const winsStat = recItem.stats?.find((s: any) => s.name === 'wins')?.value;
        const lossesStat = recItem.stats?.find((s: any) => s.name === 'losses')?.value;
        const tiesStat = recItem.stats?.find((s: any) => s.name === 'ties')?.value;
        if (winsStat !== undefined && lossesStat !== undefined) {
          record.wins = Number(winsStat);
          record.losses = Number(lossesStat);
          record.ties = Number(tiesStat || 0);
        } else if (record.summary) {
          const parts = record.summary.split('-').map(Number);
          record.wins = parts[0] || 0;
          record.losses = parts[1] || 0;
          record.ties = parts[2] || 0;
        }
      }
    }

    const schedule: GameSchedule[] = [];
    let nextGame: any = null;

    if (schedRes.ok) {
      const schedData = await schedRes.json();
      const events = schedData?.events || [];

      for (const ev of events) {
        const comp = ev.competitions?.[0];
        if (!comp) continue;

        const competitors = comp.competitors || [];
        const us = competitors.find(
          (c: any) => c.team?.abbreviation?.toLowerCase() === abbr
        );
        const opp = competitors.find(
          (c: any) => c.team?.abbreviation?.toLowerCase() !== abbr
        );

        if (!opp) continue;

        const isHome = us?.homeAway === 'home';
        const state = comp.status?.type?.state; // 'pre', 'in', 'post'
        const completed = comp.status?.type?.completed;
        const eventDate = new Date(ev.date);
        const dateStr = eventDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        const timeStr = eventDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });
        const broadcast =
          comp.broadcasts?.[0]?.media?.shortName ||
          comp.geoBroadcasts?.[0]?.media?.shortName ||
          'NFL';

        const usScore = us?.score?.displayValue ?? us?.score;
        const oppScore = opp?.score?.displayValue ?? opp?.score;

        let resultStr: string | undefined = undefined;
        let timeOrScore = timeStr;
        let status: 'SCHEDULED' | 'LIVE' | 'FINAL' = 'SCHEDULED';

        if (completed || state === 'post') {
          status = 'FINAL';
          const won = us?.winner === true;
          if (usScore !== undefined && oppScore !== undefined) {
            timeOrScore = `${usScore}-${oppScore}`;
            resultStr = `${won ? 'W' : 'L'}`;
          }
        } else if (state === 'in') {
          status = 'LIVE';
          timeOrScore = `LIVE ${usScore || 0}-${oppScore || 0} (${comp.status?.type?.shortDetail || ''})`;
        }

        const oppLogo =
          opp.team?.logos?.[0]?.href ||
          `https://a.espncdn.com/i/teamlogos/nfl/500/${opp.team?.abbreviation?.toLowerCase() || 'nfl'}.png`;

        const weekNum = ev.week?.number || schedule.length + 1;

        schedule.push({
          week: weekNum,
          date: dateStr,
          time: timeStr,
          opponent: opp.team?.displayName || opp.team?.name || 'Opponent',
          opponentLogo: oppLogo,
          isHome,
          timeOrScore,
          tvNetwork: broadcast,
          broadcastNetwork: broadcast,
          status,
          result: resultStr,
        });

        // Pick the first live or upcoming game as nextGame
        if (!nextGame && (status === 'LIVE' || status === 'SCHEDULED')) {
          const odds = comp.odds?.[0]?.details || `${teamAbbr.toUpperCase()} Matchup`;
          nextGame = {
            week: weekNum,
            opponent: opp.team?.displayName || opp.team?.name || 'Opponent',
            opponentAbbr: opp.team?.abbreviation || 'NFL',
            opponentLogo: oppLogo,
            isHome,
            date: eventDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }),
            time: timeStr,
            isoDate: ev.date,
            network: broadcast,
            broadcastNetwork: broadcast,
            spread: odds,
            stadium: comp.venue?.fullName || 'NFL Stadium',
            venue: comp.venue?.fullName || 'NFL Stadium',
          };
        }
      }

      // If season finished and all games are FINAL, show the most recent game as latest matchup
      if (!nextGame && schedule.length > 0) {
        const last = schedule[schedule.length - 1];
        nextGame = {
          week: last.week,
          opponent: last.opponent,
          opponentAbbr: 'NFL',
          opponentLogo: last.opponentLogo,
          isHome: last.isHome,
          date: last.date,
          time: `Final (${last.timeOrScore})`,
          isoDate: null,
          network: last.broadcastNetwork || 'NFL',
          broadcastNetwork: last.broadcastNetwork || 'NFL',
          spread: last.result ? `Result: ${last.result} ${last.timeOrScore}` : 'Season Finale',
          stadium: 'Official Result',
          venue: 'Official Result',
        };
      }
    }

    return { record, rankInDivision, schedule, nextGame };
  } catch (err) {
    console.warn('Live schedule fetch error:', err);
    return null;
  }
}

async function fetchRealYouTubeHighlights(teamName: string): Promise<SeasonHighlight[]> {
  try {
    const query = `NFL ${teamName} Highlights`;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cache: 'no-store',
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
      if (vr.videoId === 'dQw4w9WgXcQ') continue;

      const title = vr.title?.runs?.map((r: { text: string }) => r.text).join('') || '';
      const duration = vr.lengthText?.simpleText || 'Highlight';
      const views = vr.viewCountText?.simpleText || vr.shortViewCountText?.simpleText || 'NFL Official';
      const description =
        vr.detailedMetadataSnippets?.[0]?.snippetText?.runs
          ?.map((r: { text: string }) => r.text)
          .join('') || `Official NFL highlight reel featuring the ${teamName}.`;
      const publishedTime = vr.publishedTimeText?.simpleText || 'Official NFL';

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
  } catch {
    return [];
  }
}

async function fetchESPNDirectVideos(teamName: string, teamAbbr: string): Promise<SeasonHighlight[]> {
  const highlights: SeasonHighlight[] = [];
  try {
    const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', {
      cache: 'no-store',
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
            duration: vid.duration
              ? `${Math.floor(vid.duration / 60)}:${String(vid.duration % 60).padStart(2, '0')}`
              : '1:30',
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

async function fetchYahooAndNFLHeadlines(teamName: string): Promise<string[]> {
  const headlines: string[] = [];
  const teamHeadlines: string[] = [];
  const parts = teamName.toLowerCase().split(' ');

  // 1. Yahoo Sports NFL RSS
  try {
    const res = await fetch('https://sports.yahoo.com/nfl/rss.xml', {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const xml = await res.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      for (const item of items.slice(0, 30)) {
        const titleMatch = item.match(
          /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/
        );
        const rawTitle = (titleMatch?.[1] || titleMatch?.[2] || '')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .trim();
        if (rawTitle) {
          headlines.push(`[Yahoo Sports] ${rawTitle}`);
          if (parts.some((p) => p.length > 2 && rawTitle.toLowerCase().includes(p))) {
            teamHeadlines.push(`[Yahoo Sports] ${rawTitle}`);
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // 2. NFL.com RSS / News Feed
  try {
    const nflRes = await fetch('https://www.nfl.com/rss/rsslanding?searchString=home', {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (nflRes.ok) {
      const xml = await nflRes.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      for (const item of items.slice(0, 25)) {
        const titleMatch = item.match(
          /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/
        );
        const rawTitle = (titleMatch?.[1] || titleMatch?.[2] || '')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .trim();
        if (rawTitle) {
          headlines.push(`[NFL.com] ${rawTitle}`);
          if (parts.some((p) => p.length > 2 && rawTitle.toLowerCase().includes(p))) {
            teamHeadlines.push(`[NFL.com] ${rawTitle}`);
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // 3. ESPN Team-Specific News
  try {
    const espnRes = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=25', {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (espnRes.ok) {
      const data = await espnRes.json();
      for (const art of data?.articles || []) {
        const h = art.headline || '';
        const d = art.description || '';
        if (h) {
          headlines.push(`[ESPN] ${h} - ${d}`);
          if (
            parts.some(
              (p) =>
                p.length > 2 &&
                (h.toLowerCase().includes(p) || d.toLowerCase().includes(p))
            )
          ) {
            teamHeadlines.push(`[ESPN] ${h}: ${d}`);
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return teamHeadlines.length > 0
    ? [...teamHeadlines, ...headlines.slice(0, 5)].slice(0, 10)
    : headlines.slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamName = searchParams.get('teamName') || 'Kansas City Chiefs';
  const teamAbbr = searchParams.get('teamAbbr') || 'KC';

  const [liveTeamData, espnVideos, ytVideos, liveHeadlines] = await Promise.all([
    fetchLiveTeamScheduleAndRecord(teamAbbr),
    fetchESPNDirectVideos(teamName, teamAbbr),
    fetchRealYouTubeHighlights(teamName),
    fetchYahooAndNFLHeadlines(teamName),
  ]);

  const combinedHighlights: SeasonHighlight[] = [...espnVideos, ...ytVideos].slice(0, 6);

  let aiReport = {
    headline: `${teamName} Live Fireworks AI War Room Brief`,
    summary:
      liveHeadlines[0] ||
      `Real-time intelligence gathered for the ${teamName} from Yahoo Sports, NFL.com, and ESPN wire feeds.`,
    bulletPoints: liveHeadlines.slice(0, 3),
    poweredBy: 'Fireworks AI (Live Yahoo Sports & NFL.com Sync)',
  };

  let aiInjuries: Injury[] = [];

  if (liveHeadlines.length > 0 || liveTeamData) {
    const promptContext = [
      `Team: ${teamName} (${teamAbbr})`,
      liveTeamData?.record?.summary ? `Current Live Record: ${liveTeamData.record.summary} (${liveTeamData.rankInDivision})` : '',
      liveTeamData?.nextGame
        ? `Next/Latest Matchup: vs ${liveTeamData.nextGame.opponent} (${liveTeamData.nextGame.date} ${liveTeamData.nextGame.time})`
        : '',
      `Live Yahoo Sports, NFL.com & ESPN Headlines:\n${liveHeadlines.join('\n')}`,
    ]
      .filter(Boolean)
      .join('\n');

    const aiResponse = await callFireworksAI([
      {
        role: 'system',
        content:
          'You are Gridiron Apex AI, a real-time NFL intelligence agent powered by Fireworks AI that synthesizes live Yahoo Sports and NFL.com feeds. Respond ONLY with valid JSON containing keys: "headline" (string), "summary" (2-3 sentence factual summary of the team right now based strictly on the provided live data), "bulletPoints" (array of 3 factual news takeaways), and "injuries" (array of up to 3 objects with keys: "playerName", "position", "injury", "status" ["Out"|"Questionable"|"IR"|"Active"], "details", "lastUpdated" — based on current roster/injury status; if no major injuries are active, return an empty array []).',
      },
      {
        role: 'user',
        content: `Analyze this live NFL feed for the ${teamName}:\n${promptContext}`,
      },
    ]);

    if (aiResponse) {
      try {
        const cleaned = aiResponse.replace(/```json|```/g, '').trim();
        const jsonStart = cleaned.indexOf('{');
        const jsonEnd = cleaned.lastIndexOf('}');
        const jsonStr = jsonStart !== -1 && jsonEnd !== -1 ? cleaned.slice(jsonStart, jsonEnd + 1) : cleaned;
        const parsed = JSON.parse(jsonStr);
        if (parsed.summary) {
          aiReport = {
            headline: parsed.headline || `${teamName} Live Fireworks AI Intelligence`,
            summary: parsed.summary,
            bulletPoints: Array.isArray(parsed.bulletPoints)
              ? parsed.bulletPoints.slice(0, 3)
              : liveHeadlines.slice(0, 3),
            poweredBy: 'Fireworks AI (Live Yahoo Sports & NFL.com Sync)',
          };
        }
        if (Array.isArray(parsed.injuries) && parsed.injuries.length > 0) {
          aiInjuries = parsed.injuries.map((inj: any, i: number) => ({
            id: `live-inj-${i}`,
            playerName: inj.playerName || 'Roster Update',
            position: inj.position || 'NFL',
            teamId: teamAbbr.toLowerCase(),
            injury: inj.injury || 'Status Update',
            injuryType: inj.injury || 'Status Update',
            status: inj.status || 'Questionable',
            lastUpdated: inj.lastUpdated || 'Live Wire',
            updatedAt: inj.lastUpdated || 'Live Wire',
            details: inj.details || 'Monitored by Fireworks AI via Yahoo Sports & NFL.com',
          }));
        }
      } catch {
        aiReport.summary = aiResponse.replace(/```json|```/g, '').slice(0, 380);
      }
    }
  }

  return NextResponse.json({
    liveTeamData,
    highlights: combinedHighlights,
    aiReport,
    aiInjuries,
    yahooHeadlines: liveHeadlines.slice(0, 6),
    updatedAt: new Date().toLocaleTimeString(),
  });
}
