import { NextResponse } from 'next/server';
import { SeasonHighlight, GameSchedule, Injury, Player, TeamStats } from '@/types';
import { callFireworksAI } from '@/lib/fireworks';
import { getTeamStats } from '@/lib/team-stats';

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
    const [res, depthRes] = await Promise.all([
      fetch(
        `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${abbr}/roster`,
        {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        }
      ),
      fetch(
        `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${abbr}/depthcharts`,
        {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        }
      ),
    ]);
    if (!res.ok) return { injuries, starPlayers };

    const data = await res.json();
    const depthData = depthRes.ok ? await depthRes.json() : null;

    const depthRankById: Record<string, number> = {};
    for (const dc of depthData?.depthchart || []) {
      for (const [posKey, posObj] of Object.entries(dc.positions || {}) as [string, any][]) {
        if (['pr', 'kr', 'h'].includes(posKey.toLowerCase())) continue;
        (posObj?.athletes || []).forEach((ath: any, idx: number) => {
          const aid = String(ath.id);
          const rank = idx + 1;
          if (!depthRankById[aid] || rank < depthRankById[aid]) {
            depthRankById[aid] = rank;
          }
        });
      }
    }

    const FRANCHISE_STARS = new Set([
      'Bo Nix', 'J.K. Dobbins', 'RJ Harvey', 'Courtland Sutton', 'Jaylen Waddle', 'Marvin Mims Jr.', 'Evan Engram', 'Pat Surtain II', 'Nik Bonitto', 'Zach Allen', 'Talanoa Hufanga', 'Jonathon Cooper',
      'Patrick Mahomes', 'Kenneth Walker III', 'Rashee Rice', 'Xavier Worthy', 'Josh Downs', 'Travis Kelce', 'Chris Jones', 'Trent McDuffie',
      'Brock Purdy', 'Christian McCaffrey', 'Brandon Aiyuk', 'Deebo Samuel Sr.', 'Mike Evans', 'Keenan Allen', 'George Kittle', 'Nick Bosa', 'Fred Warner',
      'Lamar Jackson', 'Derrick Henry', 'Zay Flowers', 'Rashod Bateman', 'Mark Andrews', 'Roquan Smith', 'Kyle Hamilton', 'Nnamdi Madubuike',
      'Jared Goff', 'Jahmyr Gibbs', 'Isiah Pacheco', 'Amon-Ra St. Brown', 'Jameson Williams', 'Sam LaPorta', 'Aidan Hutchinson', 'Brian Branch',
      'Josh Allen', 'James Cook III', 'DJ Moore', 'Khalil Shakir', 'Keon Coleman', 'Dalton Kincaid', 'Ed Oliver', 'Greg Rousseau',
      'Jalen Hurts', 'Saquon Barkley', 'DeVonta Smith', 'Dallas Goedert', 'Jalen Carter', 'Zack Baun', 'Quinyon Mitchell', 'Cooper DeJean',
      'Kyler Murray', 'Kirk Cousins', 'Aaron Jones Sr.', 'Jordan Mason', 'Justin Jefferson', 'Jordan Addison', 'Jauan Jennings', 'T.J. Hockenson',
      'Jordan Love', 'Josh Jacobs', 'Jayden Reed', 'Christian Watson', 'Matthew Golden', 'Tucker Kraft', 'Xavier McKinney', 'Rashan Gary',
      'C.J. Stroud', 'David Montgomery', 'Nico Collins', 'Marvin Harrison Jr.', 'Tank Dell', 'Dalton Schultz', 'Will Anderson Jr.', 'Danielle Hunter', 'Derek Stingley Jr.',
      'Jayden Daniels', 'Austin Ekeler', 'Rachaad White', 'Terry McLaurin', 'Stefon Diggs', 'Chig Okonkwo', 'Frankie Luvu',
      'Aaron Rodgers', 'Jaylen Warren', 'Rico Dowdle', 'DK Metcalf', 'Michael Pittman Jr.', 'Pat Freiermuth', 'Darnell Washington', 'T.J. Watt', 'Minkah Fitzpatrick', 'Cam Heyward',
      'Michael Penix Jr.', 'Tua Tagovailoa', 'Bijan Robinson', 'Drake London', 'Kyle Pitts Sr.', 'Jessie Bates III',
      'Baker Mayfield', 'Bucky Irving', 'Chris Godwin Jr.', 'Emeka Egbuka', 'Jalen McMillan', 'Cade Otton', 'Antoine Winfield Jr.', 'Vita Vea',
      'Caleb Williams', "D'Andre Swift", 'Rome Odunze', 'Luther Burden III', 'Cole Kmet', 'Colston Loveland', 'Montez Sweat', 'Jaylon Johnson',
      'Dak Prescott', 'Javonte Williams', 'CeeDee Lamb', 'George Pickens', 'Jake Ferguson', 'Micah Parsons', 'DaRon Bland', 'Trevon Diggs',
      'Joe Burrow', 'Chase Brown', "Ja'Marr Chase", 'Tee Higgins', 'Mike Gesicki', 'Trey Hendrickson',
      'Geno Smith', 'Breece Hall', 'Braelon Allen', 'Garrett Wilson', 'Adonai Mitchell', 'Mason Taylor', 'Quinnen Williams', 'Sauce Gardner',
      'Malik Willis', 'Kyle McCord', "De'Von Achane", 'Jaylen Wright', 'Malik Washington', 'Jalen Tolbert', 'Greg Dulcich',
      'Sam Darnold', 'Zach Charbonnet', 'Jaxon Smith-Njigba', 'Cooper Kupp', 'Rashid Shaheed', 'Devon Witherspoon', 'Leonard Williams',
      'Justin Herbert', 'Omarion Hampton', 'Ladd McConkey', 'Quentin Johnston', 'David Njoku', 'Khalil Mack', 'Derwin James Jr.',
      'Matthew Stafford', 'Kyren Williams', 'Puka Nacua', 'Davante Adams', 'Tutu Atwell', 'Tyler Higbee', 'Jared Verse', 'Braden Fiske',
      'Anthony Richardson Sr.', 'Daniel Jones', 'Jonathan Taylor', 'Alec Pierce', 'Tyler Warren', 'DeForest Buckner', 'Zaire Franklin',
      'Carson Beck', 'Gardner Minshew II', 'James Conner', 'Trey Benson', 'Tyler Allgeier', 'Michael Wilson', 'Trey McBride', 'Budda Baker',
      'Spencer Rattler', 'Tyler Shough', 'Alvin Kamara', 'Travis Etienne Jr.', 'Chris Olave', 'Juwan Johnson', 'Noah Fant', 'Cameron Jordan',
      'Fernando Mendoza', "Aidan O'Connell", 'Ashton Jeanty', 'Tre Tucker', 'Jack Bech', 'Brock Bowers', 'Maxx Crosby',
      'Trevor Lawrence', 'Bhayshul Tuten', 'Brian Thomas Jr.', 'Travis Hunter', 'Jakobi Meyers', 'Brenton Strange', 'Josh Hines-Allen', 'Travon Walker',
      'Deshaun Watson', 'Shedeur Sanders', 'Quinshon Judkins', 'Jerry Jeudy', 'Harold Fannin Jr.', 'Myles Garrett', 'Denzel Ward',
      'Cam Ward', 'Tony Pollard', 'Tyjae Spears', 'Calvin Ridley', "Wan'Dale Robinson", 'Carnell Tate', 'Jeffery Simmons',
      'Drake Maye', 'Rhamondre Stevenson', 'TreVeyon Henderson', 'A.J. Brown', 'DeMario Douglas', 'Romeo Doubs', 'Hunter Henry', 'Christian Gonzalez',
      'J.J. McCarthy', 'Jaxson Dart', 'Tyrone Tracy Jr.', 'Cam Skattebo', 'Devin Singletary', 'Malik Nabers', 'Darnell Mooney', 'Isaiah Likely', 'Dexter Lawrence II', 'Brian Burns',
      'Bryce Young', 'Chuba Hubbard', 'Jonathon Brooks', 'Tetairoa McMillan', 'Xavier Legette', 'Jalen Coker', "Ja'Tavion Sanders", 'Derrick Brown', 'Jaycee Horn',
    ]);

    const groups = data?.athletes || [];
    const posPriority: Record<string, number> = {
      QB: 1, RB: 2, WR: 3, TE: 4, DE: 5, DT: 6, NT: 6, LB: 7, OLB: 7, ILB: 7, CB: 8, S: 9, FS: 9, SS: 9, DB: 9, OT: 10, G: 11, C: 12, OL: 12, PK: 13, K: 13, P: 14, LS: 15, FB: 16,
    };

    const seenPlayerIds = new Set<string>();
    const rawPlayers: (Player & { _depthRank: number; _starTier: number })[] = [];

    for (const group of groups) {
      if (group?.position === 'practiceSquad') continue;
      const items = group?.items || [];
      for (const athlete of items) {
        if (athlete.status?.type === 'practice-squad') continue;
        const aidStr = String(athlete.id);
        if (seenPlayerIds.has(aidStr)) continue;
        seenPlayerIds.add(aidStr);

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

        let playerStatus: Player['status'] = 'Active';
        if (athlete.status?.type === 'day-to-day') {
          playerStatus = 'Questionable';
        } else if (group?.position === 'injuredReserveOrOut') {
          playerStatus = 'IR';
        }

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

            playerStatus = mappedStatus;

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

        const isStar = FRANCHISE_STARS.has(fullName) && !(fullName === 'Justin Jefferson' && pos === 'LB');
        const dRank = isStar ? 1 : (depthRankById[aidStr] || 99);
        const depthBadge = dRank === 1 ? 'Starter • ' : '';

        rawPlayers.push({
          id: `p-${abbr}-${athlete.id}`,
          name: fullName,
          position: pos,
          number: jersey,
          teamId: abbr,
          avatarUrl,
          status: playerStatus,
          college,
          experience: expStr,
          statsHighlight: `${depthBadge}${pos} #${jersey} • ${college} • ${expStr}`,
          _depthRank: dRank,
          _starTier: isStar ? 0 : (dRank === 1 ? 1 : 2),
        });
      }
    }

    rawPlayers.sort((a, b) => {
      if (a._starTier !== b._starTier) return a._starTier - b._starTier;
      const pDiff = (posPriority[a.position] || 99) - (posPriority[b.position] || 99);
      if (pDiff !== 0) return pDiff;
      return (a._depthRank || 99) - (b._depthRank || 99);
    });

    for (const p of rawPlayers) {
      const { _depthRank, _starTier, ...cleanPlayer } = p;
      starPlayers.push(cleanPlayer);
    }

    return { injuries: injuries.slice(0, 15), starPlayers };
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
        const state = comp.status?.type?.state;
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

async function isEmbedPlayable(videoId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.youtube.com/embed/${videoId}`, {
      headers: {
        Referer: 'http://localhost:3000/',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    const html = await res.text();
    return (
      !html.includes('UNPLAYABLE') &&
      !html.includes('Playback on other websites has been disabled')
    );
  } catch {
    return false;
  }
}

async function scrapeYouTubeQuery(query: string, teamName: string): Promise<YouTubeScrapedVideo[]> {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const match = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
    if (!match || !match[1]) return [];

    const data = JSON.parse(match[1]);
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
        ?.contents?.[0]?.itemSectionRenderer?.contents || [];

    const candidates: YouTubeScrapedVideo[] = [];
    for (const item of contents) {
      const vr = item.videoRenderer;
      if (!vr || !vr.videoId || vr.videoId === 'dQw4w9WgXcQ') continue;

      const ownerName = vr.ownerText?.runs?.[0]?.text || '';
      // Skip official NFL channel uploads that block third-party iframe embeds
      if (ownerName === 'NFL') continue;

      const title = vr.title?.runs?.map((r: { text: string }) => r.text).join('') || '';
      const duration = vr.lengthText?.simpleText || 'Highlight';
      const views =
        vr.viewCountText?.simpleText || vr.shortViewCountText?.simpleText || ownerName || 'NFL Highlight';
      const description =
        vr.detailedMetadataSnippets?.[0]?.snippetText?.runs
          ?.map((r: { text: string }) => r.text)
          .join('') || `Embedded highlight & breakdown featuring the ${teamName}.`;
      const publishedTime = ownerName
        ? `${ownerName} • ${vr.publishedTimeText?.simpleText || 'Live'}`
        : vr.publishedTimeText?.simpleText || 'NFL';

      if (title) {
        candidates.push({
          videoId: vr.videoId,
          title,
          duration,
          views,
          description,
          publishedTime,
        });
      }
      if (candidates.length >= 10) break;
    }
    return candidates;
  } catch {
    return [];
  }
}

async function fetchRealYouTubeHighlights(teamName: string): Promise<SeasonHighlight[]> {
  try {
    const [cbsResults, espnResults, hlResults] = await Promise.all([
      scrapeYouTubeQuery(`${teamName} CBS Sports highlights`, teamName),
      scrapeYouTubeQuery(`${teamName} ESPN highlights`, teamName),
      scrapeYouTubeQuery(`${teamName} full game highlights`, teamName),
    ]);

    const seen = new Set<string>();
    const allCandidates: YouTubeScrapedVideo[] = [];
    for (const v of [...cbsResults, ...espnResults, ...hlResults]) {
      if (!seen.has(v.videoId)) {
        seen.add(v.videoId);
        allCandidates.push(v);
      }
    }

    const toVerify = allCandidates.slice(0, 12);
    const playabilityFlags = await Promise.all(toVerify.map((v) => isEmbedPlayable(v.videoId)));
    const verified = toVerify.filter((_, idx) => playabilityFlags[idx]).slice(0, 6);

    const finalVideos = verified.length > 0 ? verified : toVerify.slice(0, 6);

    return finalVideos.map((v, idx) => ({
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

    return highlights;
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

  // 3. ESPN News
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

async function fetchLiveTeamStats(teamAbbr: string): Promise<TeamStats> {
  const abbr = teamAbbr.toLowerCase();
  const baseStats = getTeamStats(abbr);

  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${abbr}/statistics`,
      {
        cache: 'no-store',
        signal: AbortSignal.timeout(4500),
      }
    );
    if (!res.ok) return baseStats;

    const data = await res.json();
    const cats = data?.results?.stats?.categories || [];
    const oppCats = data?.results?.opponent || [];

    const getVal = (arr: any[], catName: string, statName: string, fallback: number) => {
      if (!Array.isArray(arr)) return fallback;
      const cat = arr.find((c: any) => c.name === catName);
      const st = cat?.stats?.find((s: any) => s.name === statName);
      if (!st) return fallback;
      const raw = st.value ?? parseFloat(String(st.displayValue || '0').replace(/,/g, ''));
      return isNaN(raw) ? fallback : Number(raw.toFixed(1));
    };

    const passYPG = getVal(cats, 'passing', 'netPassingYardsPerGame', baseStats.passingYardsPerGame);
    const rushYPG = getVal(cats, 'rushing', 'rushingYardsPerGame', baseStats.rushingYardsPerGame);
    const totalYPG = Number((passYPG + rushYPG).toFixed(1));
    const ppg = getVal(cats, 'scoring', 'totalPointsPerGame', baseStats.pointsPerGame);

    const oppPassYPG = getVal(oppCats, 'passing', 'netPassingYardsPerGame', baseStats.passYardsAllowedPerGame);
    const oppRushYPG = getVal(oppCats, 'rushing', 'rushingYardsPerGame', baseStats.rushYardsAllowedPerGame);
    const yardsAllowedPG = getVal(oppCats, 'passing', 'yardsPerGame', Number((oppPassYPG + oppRushYPG).toFixed(1)));
    const ptsAllowedPG = getVal(oppCats, 'scoring', 'totalPointsPerGame', baseStats.pointsAllowedPerGame);

    const sacks = getVal(cats, 'defensive', 'sacks', baseStats.sacks);
    const interceptions = getVal(cats, 'defensiveInterceptions', 'interceptions', baseStats.interceptions);
    const turnoverDiff = getVal(cats, 'miscellaneous', 'turnOverDifferential', baseStats.turnoverDifferential);
    const thirdDownPct = getVal(cats, 'miscellaneous', 'thirdDownConvPct', baseStats.thirdDownPct);
    const redZonePct = getVal(cats, 'miscellaneous', 'redzoneTouchdownPct', baseStats.redZonePct);

    return {
      ...baseStats,
      pointsPerGame: ppg,
      pointsAllowedPerGame: ptsAllowedPG,
      totalYardsPerGame: totalYPG,
      passingYardsPerGame: passYPG,
      rushingYardsPerGame: rushYPG,
      yardsAllowedPerGame: yardsAllowedPG,
      passYardsAllowedPerGame: oppPassYPG,
      rushYardsAllowedPerGame: oppRushYPG,
      turnoverDifferential: turnoverDiff,
      sacks,
      interceptions,
      thirdDownPct,
      redZonePct,
    };
  } catch {
    return baseStats;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamName = searchParams.get('teamName') || 'Denver Broncos';
  const teamAbbr = searchParams.get('teamAbbr') || 'DEN';

  const [liveTeamData, rosterAndInjuries, liveTeamStats, espnVideos, ytVideos, liveHeadlines] = await Promise.all([
    fetchLiveTeamScheduleAndRecord(teamAbbr),
    fetchLiveRosterAndInjuries(teamAbbr),
    fetchLiveTeamStats(teamAbbr),
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
    liveTeamStats,
    highlights: combinedHighlights,
    aiReport,
    aiInjuries: rosterAndInjuries.injuries,
    liveStarPlayers: rosterAndInjuries.starPlayers,
    yahooHeadlines: liveHeadlines.slice(0, 6),
    updatedAt: new Date().toLocaleTimeString(),
  });
}
