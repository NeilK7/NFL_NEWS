import { NextResponse } from 'next/server';
import { SeasonHighlight, GameSchedule, Injury, Player } from '@/types';
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

async function fetchLiveRosterAndInjuries(teamAbbr: string): Promise<{
  injuries: Injury[];
  starPlayers: Player[];
}> {
  const abbr = teamAbbr.toLowerCase();
  const injuries: Injury[] = [];
  const starPlayers: Player[] = [];

  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${abbr}/roster`,
      {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) return { injuries, starPlayers };

    const data = await res.json();
    const groups = data?.athletes || [];
    const keyPositions = new Set(['QB', 'RB', 'WR', 'TE', 'DE', 'LB', 'CB', 'S', 'DT', 'OT']);

    for (const group of groups) {
      const items = group?.items || [];
      for (const athlete of items) {
        const pos = athlete.position?.abbreviation || 'NFL';
        const fullName = athlete.fullName || athlete.displayName || 'Player';
        const jersey = Number(athlete.jersey || 0);
        const expYears = athlete.experience?.years;
        const expStr =
          expYears === 0
            ? 'Rookie'
            : expYears
            ? `${expYears} yr${expYears > 1 ? 's' : ''} exp`
            : 'Active Roster';
        const college = athlete.college?.name || 'NFL';
        const avatarUrl =
          athlete.headshot?.href ||
          `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr}.png`;

        // Extract real live injuries from the official roster wire
        if (Array.isArray(athlete.injuries) && athlete.injuries.length > 0) {
          for (const inj of athlete.injuries) {
            const rawStatus = inj.status || athlete.status?.name || 'Questionable';
            let mappedStatus: Injury['status'] = 'Questionable';
            if (rawStatus.toLowerCase().includes('ir') || rawStatus.toLowerCase().includes('reserve')) {
              mappedStatus = 'IR';
            } else if (rawStatus.toLowerCase().includes('out')) {
              mappedStatus = 'Out';
            } else if (rawStatus.toLowerCase().includes('doubtful')) {
              mappedStatus = 'Doubtful';
            } else if (rawStatus.toLowerCase().includes('active')) {
              mappedStatus = 'Active';
            }

            const injType =
              inj.details?.type ||
              inj.type?.description ||
              inj.type?.name ||
              'Undisclosed';
            const comment =
              inj.shortComment ||
              inj.longComment ||
              `${fullName} (${pos}) is listed as ${rawStatus} (${injType}).`;
            const dateStr = inj.date
              ? new Date(inj.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Live Report';

            injuries.push({
              id: `real-inj-${athlete.id}-${inj.id || injuries.length}`,
              playerName: fullName,
              position: pos,
              teamId: abbr,
              injury: injType,
              injuryType: injType,
              status: mappedStatus,
              lastUpdated: dateStr,
              updatedAt: dateStr,
              details: comment,
              practiceStatus: comment,
            });
          }
        }

        // Collect key active star players from the live roster
        if (
          keyPositions.has(pos) &&
          athlete.status?.type === 'active' &&
          athlete.headshot?.href
        ) {
          // Prioritize QBs and experienced veterans
          const weightScore =
            (pos === 'QB' ? 100 : pos === 'WR' || pos === 'RB' ? 60 : 40) +
            Math.min(Number(expYears || 1) * 5, 45);
          (athlete as any)._score = weightScore;
          starPlayers.push({
            id: `live-p-${athlete.id}`,
            name: fullName,
            position: pos,
            number: jersey,
            teamId: abbr,
            avatarUrl,
            status: 'Active',
            college,
            experience: expStr,
            statsHighlight: `${college} • ${expStr}`,
          });
        }
      }
    }

    // Pick top 8 star players (starting QB + top weapons/defenders)
    const sortedPlayers = starPlayers.slice(0, 8);
    return { injuries: injuries.slice(0, 12), starPlayers: sortedPlayers };
  } catch (err) {
    console.warn('Live roster/injury fetch error:', err);
    return { injuries, starPlayers };
  }
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

    const record = { wins: 0, losses: 0, ties: 0, summary: '' };
    let rankInDivision = '';
    let nextEventFromTeam: any = null;

    if (teamRes.ok) {
      const teamData = await teamRes.json();
      const t = teamData?.team;
      rankInDivision = t?.standingSummary || '';
      nextEventFromTeam = t?.nextEvent?.[0] || null;
      const recItem =
        t?.record?.items?.find((i: any) => i.type === 'total') || t?.record?.items?.[0];
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
      let events = schedData?.events || [];

      // If current default schedule is empty (e.g. between postseason & regular season), also check team.nextEvent
      if (events.length === 0 && nextEventFromTeam) {
        events = [nextEventFromTeam];
      }

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
          year: 'numeric',
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
          timeOrScore = `LIVE ${usScore || 0}-${oppScore || 0} (${
            comp.status?.type?.shortDetail || ''
          })`;
        }

        const oppLogo =
          opp.team?.logos?.[0]?.href ||
          opp.team?.logo ||
          `https://a.espncdn.com/i/teamlogos/nfl/500/${
            opp.team?.abbreviation?.toLowerCase() || 'nfl'
          }.png`;

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

        if (!nextGame && (status === 'LIVE' || status === 'SCHEDULED')) {
          const odds = comp.odds?.[0]?.details || `${teamAbbr.toUpperCase()} Live Line`;
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
              year: 'numeric',
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

      if (!nextGame && schedule.length > 0) {
        const last = schedule[schedule.length - 1];
        nextGame = {
          week: last.week,
          opponent: last.opponent,
          opponentAbbr: 'NFL',
          opponentLogo: last.opponentLogo,
          isHome: last.isHome,
          date: last.date,
          time: last.result ? `Final (${last.result} ${last.timeOrScore})` : last.timeOrScore,
          isoDate: null,
          network: last.broadcastNetwork || 'NFL',
          broadcastNetwork: last.broadcastNetwork || 'NFL',
          spread: last.result ? `Official Result: ${last.result} ${last.timeOrScore}` : 'Official NFL Slate',
          stadium: 'Official NFL Game',
          venue: 'Official NFL Game',
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
      const views =
        vr.viewCountText?.simpleText || vr.shortViewCountText?.simpleText || 'NFL Official';
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
            description:
              vid.description || hl.description || `Official ESPN broadcast highlight from ${ev.name}.`,
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

  // 2. NFL.com Official RSS
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
    const espnRes = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=25',
      {
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      }
    );
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

  const [liveTeamData, rosterAndInjuries, espnVideos, ytVideos, liveHeadlines] = await Promise.all([
    fetchLiveTeamScheduleAndRecord(teamAbbr),
    fetchLiveRosterAndInjuries(teamAbbr),
    fetchESPNDirectVideos(teamName, teamAbbr),
    fetchRealYouTubeHighlights(teamName),
    fetchYahooAndNFLHeadlines(teamName),
  ]);

  const combinedHighlights: SeasonHighlight[] = [...espnVideos, ...ytVideos].slice(0, 6);

  let aiReport = {
    headline: `${teamName} Live Fireworks AI War Room Brief`,
    summary:
      liveHeadlines[0] ||
      `Real-time intelligence gathered for the ${teamName} (${
        liveTeamData?.record?.summary || ''
      }) from Yahoo Sports, NFL.com, and official NFL wire feeds.`,
    bulletPoints: liveHeadlines.slice(0, 3),
    poweredBy: 'Fireworks AI (Live Yahoo Sports & NFL.com Sync)',
  };

  if (liveHeadlines.length > 0 || liveTeamData) {
    const promptContext = [
      `Team: ${teamName} (${teamAbbr})`,
      liveTeamData?.record?.summary
        ? `Current Official Record: ${liveTeamData.record.summary} (${liveTeamData.rankInDivision})`
        : '',
      liveTeamData?.nextGame
        ? `Matchup Info: vs ${liveTeamData.nextGame.opponent} (${liveTeamData.nextGame.date} - ${liveTeamData.nextGame.time})`
        : '',
      rosterAndInjuries.injuries.length > 0
        ? `Official Active Injury Report: ${rosterAndInjuries.injuries
            .slice(0, 5)
            .map((i) => `${i.playerName} (${i.position}, ${i.status} - ${i.injury})`)
            .join('; ')}`
        : 'Official Active Injury Report: No major starters listed out.',
      `Live Yahoo Sports, NFL.com & ESPN Headlines:\n${liveHeadlines.join('\n')}`,
    ]
      .filter(Boolean)
      .join('\n');

    const aiResponse = await callFireworksAI([
      {
        role: 'system',
        content:
          'You are Gridiron Apex AI, a real-time NFL intelligence agent powered by Fireworks AI that synthesizes live Yahoo Sports and NFL.com feeds. Respond ONLY with valid JSON containing keys: "headline" (string), "summary" (2-3 sentence factual summary of the team right now based strictly on the provided live record, matchup, injuries, and headlines), and "bulletPoints" (array of 3 factual news takeaways from the provided feed). Never invent fake scores or dates.',
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
        const jsonStr =
          jsonStart !== -1 && jsonEnd !== -1 ? cleaned.slice(jsonStart, jsonEnd + 1) : cleaned;
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
      } catch {
        aiReport.summary = aiResponse.replace(/```json|```/g, '').slice(0, 380);
      }
    }
  }

  return NextResponse.json({
    liveTeamData,
    highlights: combinedHighlights,
    aiReport,
    aiInjuries: rosterAndInjuries.injuries,
    liveStarPlayers: rosterAndInjuries.starPlayers,
    yahooHeadlines: liveHeadlines.slice(0, 6),
    updatedAt: new Date().toLocaleTimeString(),
  });
}
