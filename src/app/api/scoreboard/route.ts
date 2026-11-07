import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [scoreRes, yahooRes, nflRes] = await Promise.all([
      fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      }).catch(() => null),
      fetch('https://sports.yahoo.com/nfl/rss.xml', {
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      }).catch(() => null),
      fetch('https://www.nfl.com/rss/rsslanding?searchString=home', {
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      }).catch(() => null),
    ]);

    const games: any[] = [];
    const teamRecords: Record<string, { wins: number; losses: number; ties: number }> = {};
    const tickerItems: { tag: string; text: string }[] = [];
    let weekLabel = 'Live NFL Slate';

    if (scoreRes && scoreRes.ok) {
      const data = await scoreRes.json();
      if (data?.week?.number) {
        weekLabel = `Week ${data.week.number} Official NFL Slate`;
      }
      const events = data?.events || [];

      for (const ev of events) {
        const comp = ev.competitions?.[0];
        if (!comp) continue;
        const competitors = comp.competitors || [];
        const home = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
        const away = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];
        if (!home || !away) continue;

        const parseRec = (recStr?: string) => {
          if (!recStr) return { wins: 0, losses: 0, ties: 0 };
          const parts = recStr.split('-').map(Number);
          return { wins: parts[0] || 0, losses: parts[1] || 0, ties: parts[2] || 0 };
        };

        const homeAbbr = (home.team?.abbreviation || '').toLowerCase();
        const awayAbbr = (away.team?.abbreviation || '').toLowerCase();
        const homeRecSummary = home.records?.[0]?.summary || '';
        const awayRecSummary = away.records?.[0]?.summary || '';

        if (homeAbbr && homeRecSummary) teamRecords[homeAbbr] = parseRec(homeRecSummary);
        if (awayAbbr && awayRecSummary) teamRecords[awayAbbr] = parseRec(awayRecSummary);

        const state = comp.status?.type?.state;
        const isLive = state === 'in';
        const statusDetail = comp.status?.type?.shortDetail || comp.status?.type?.detail || 'Scheduled';
        const network =
          comp.broadcasts?.[0]?.media?.shortName ||
          comp.geoBroadcasts?.[0]?.media?.shortName ||
          'NFL';
        const downDist =
          comp.situation?.downDistanceText ||
          (state === 'post' ? 'Final' : homeRecSummary ? `${away.team?.abbreviation} (${awayRecSummary}) @ ${home.team?.abbreviation} (${homeRecSummary})` : 'NFL Matchup');

        const gameObj = {
          id: ev.id,
          homeTeam: {
            id: homeAbbr,
            name: home.team?.shortDisplayName || home.team?.name || 'Home',
            abbreviation: home.team?.abbreviation || 'HOME',
            logoUrl:
              home.team?.logo ||
              `https://a.espncdn.com/i/teamlogos/nfl/500/${homeAbbr || 'nfl'}.png`,
            record: homeRecSummary,
          },
          awayTeam: {
            id: awayAbbr,
            name: away.team?.shortDisplayName || away.team?.name || 'Away',
            abbreviation: away.team?.abbreviation || 'AWAY',
            logoUrl:
              away.team?.logo ||
              `https://a.espncdn.com/i/teamlogos/nfl/500/${awayAbbr || 'nfl'}.png`,
            record: awayRecSummary,
          },
          homeScore: Number(home.score || 0),
          awayScore: Number(away.score || 0),
          status: statusDetail,
          isLive,
          possession: comp.situation?.possession === home.id ? homeAbbr : comp.situation?.possession === away.id ? awayAbbr : null,
          downDistance: downDist,
          network,
          broadcastType: ev.shortName || 'NFL Matchup',
        };

        games.push(gameObj);

        if (isLive || state === 'post') {
          tickerItems.push({
            tag: isLive ? 'LIVE SCORE' : 'FINAL',
            text: `${gameObj.awayTeam.abbreviation} ${gameObj.awayScore} @ ${gameObj.homeTeam.abbreviation} ${gameObj.homeScore} (${statusDetail})`,
          });
        } else {
          tickerItems.push({
            tag: 'UPCOMING',
            text: `${gameObj.awayTeam.name} @ ${gameObj.homeTeam.name} (${statusDetail} on ${network})`,
          });
        }
      }
    }

    if (yahooRes && yahooRes.ok) {
      const xml = await yahooRes.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      for (const item of items.slice(0, 4)) {
        const titleMatch = item.match(
          /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/
        );
        const rawTitle = (titleMatch?.[1] || titleMatch?.[2] || '')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .trim();
        if (rawTitle) {
          tickerItems.push({ tag: 'YAHOO SPORTS', text: rawTitle });
        }
      }
    }

    if (nflRes && nflRes.ok) {
      const xml = await nflRes.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      for (const item of items.slice(0, 4)) {
        const titleMatch = item.match(
          /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/
        );
        const rawTitle = (titleMatch?.[1] || titleMatch?.[2] || '')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .trim();
        if (rawTitle) {
          tickerItems.push({ tag: 'NFL.COM', text: rawTitle });
        }
      }
    }

    return NextResponse.json({
      weekLabel,
      games,
      teamRecords,
      tickerItems: tickerItems.slice(0, 12),
      updatedAt: new Date().toLocaleTimeString(),
    });
  } catch (err) {
    console.warn('Scoreboard API error:', err);
    return NextResponse.json({
      weekLabel: 'Live NFL Slate',
      games: [],
      teamRecords: {},
      tickerItems: [],
      updatedAt: new Date().toLocaleTimeString(),
    });
  }
}
