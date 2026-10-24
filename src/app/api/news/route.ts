import { NextResponse } from 'next/server';
import { NewsArticle } from '@/types';

const FALLBACK_ARTICLES: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Davante Adams Reunited With Aaron Rodgers in Blockbuster Jets Trade',
    summary: 'The New York Jets acquired three-time All-Pro receiver Davante Adams from the Las Vegas Raiders for a conditional third-round pick, reuniting him with former Packers MVP quarterback Aaron Rodgers.',
    source: 'Yahoo Sports',
    author: 'Jori Epstein',
    publishedAt: '2 hours ago',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60',
    url: 'https://sports.yahoo.com/nfl',
    tags: ['Jets', 'Trade', 'Aaron Rodgers', 'Davante Adams'],
    teamId: 'nyj',
    aiSummary: {
      executiveBrief: 'Davante Adams was dealt to the Jets for a conditional 3rd rounder that can elevate to a 2nd round pick based on performance benchmarks.',
      keyTakeaways: [
        'Rodgers and Adams previously connected for 68 touchdowns in Green Bay.',
        'Garrett Wilson slides to the perimeter WR2 role, significantly easing double-coverage.',
        'Immediate debut slated for Sunday Night Football against Pittsburgh.'
      ],
      fantasyImpact: 'Boosts Aaron Rodgers to QB1 territory and solidifies Adams as a high-volume WR1 target in PPR formats.',
      urgency: 'HIGH',
    },
  },
  {
    id: 'news-2',
    title: 'Super Bowl LVIII Rematch: 49ers Brace for Undefeated Chiefs in Santa Clara',
    summary: 'Kansas City arrives at Levi\'s Stadium looking to protect their 6-0 record as Kyle Shanahan and Brock Purdy seek redemption in their biggest regular-season contest of the autumn.',
    source: 'ESPN',
    author: 'Nick Wagoner',
    publishedAt: '3 hours ago',
    imageUrl: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&auto=format&fit=crop&q=60',
    url: 'https://www.espn.com/nfl',
    tags: ['Chiefs', '49ers', 'Mahomes', 'Purdy'],
    teamId: 'sf',
    aiSummary: {
      executiveBrief: 'The Chiefs visit the 49ers in the season\'s marquee Week 7 matchup with both teams battling critical offensive injuries.',
      keyTakeaways: [
        'Kansas City defense ranks 3rd in EPA per play allowed against zone runs.',
        'San Francisco activated rookie WR Ricky Pearsall after remarkable gunshot recovery.',
        'Mahomes is 4-0 against the 49ers in his career including two Super Bowl victories.'
      ],
      fantasyImpact: 'George Kittle and Jordan Mason remain auto-starts despite heavy defensive coverage.',
      urgency: 'HIGH',
    },
  },
  {
    id: 'news-3',
    title: 'King Henry Dominance: How Baltimore\'s Ground Game Reshaped the AFC Playoff Race',
    summary: 'Derrick Henry leads the league with 704 rushing yards and 8 touchdowns, turning Lamar Jackson\'s read-option offense into an unstoppable sledgehammer.',
    source: 'NFL Insider',
    author: 'Daniel Jeremiah',
    publishedAt: '4 hours ago',
    imageUrl: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&auto=format&fit=crop&q=60',
    url: 'https://www.nfl.com',
    tags: ['Ravens', 'Lamar Jackson', 'Derrick Henry'],
    teamId: 'bal',
    aiSummary: {
      executiveBrief: 'Baltimore has averaged an astonishing 205.3 rushing yards per game through six weeks.',
      keyTakeaways: [
        'Derrick Henry is generating 4.2 yards after contact per carry.',
        'Play-action efficiency for Lamar Jackson has risen to a career-best 138.2 passer rating.',
        'Ravens have won 4 straight games by an average margin of 14 points.'
      ],
      fantasyImpact: 'Derrick Henry is the undisputed #1 overall fantasy running back right now.',
      urgency: 'MEDIUM',
    },
  },
  {
    id: 'news-4',
    title: 'Aidan Hutchinson Successfully Undergoes Surgery; Lions Defense Prepares Next Man Up',
    summary: 'Detroit head coach Dan Campbell addressed the media following Aidan Hutchinson\'s fractured tibia and fibula, expressing optimism for a full recovery while outlining defensive line adjustments.',
    source: 'Yahoo Sports',
    author: 'Charles Robinson',
    publishedAt: '5 hours ago',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60',
    url: 'https://sports.yahoo.com/nfl',
    tags: ['Lions', 'Injuries', 'Aidan Hutchinson'],
    teamId: 'det',
    aiSummary: {
      executiveBrief: 'Lions pass rush loses their anchor who led the NFL with 7.5 sacks before the injury in Dallas.',
      keyTakeaways: [
        'Brad Holmes actively evaluating the trade market before the November deadline.',
        'Lions face undefeated Minnesota Vikings for first place in the NFC North this Sunday.',
        'Defense held Dallas to zero touchdowns despite Hutchinson leaving in the 3rd quarter.'
      ],
      fantasyImpact: 'Stream opposing quarterbacks against Detroit while their pass rush reorganizes.',
      urgency: 'HIGH',
    },
  },
  {
    id: 'news-5',
    title: 'Drake Maye\'s Promising Spark: New England Rookie Ignites Passing Attack',
    summary: 'Despite a Week 6 loss, third-overall pick Drake Maye tossed three touchdowns in his NFL starting debut, giving the Patriots franchise its highest offensive ceiling in years.',
    source: 'ESPN',
    author: 'Mike Reiss',
    publishedAt: '7 hours ago',
    imageUrl: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&auto=format&fit=crop&q=60',
    url: 'https://www.espn.com/nfl',
    tags: ['Patriots', 'Drake Maye', 'Rookies'],
    teamId: 'ne',
    aiSummary: {
      executiveBrief: 'Drake Maye showed poise and arm strength in London prep against the Jaguars.',
      keyTakeaways: [
        'Maye completed 20 of 33 passes with 243 yards and 3 scores.',
        'Offensive line pass protection rate improved by 14% with Maye\'s mobility.'
      ],
      fantasyImpact: 'Deep league superflex target; improves outlook for Demario Douglas.',
      urgency: 'ROUTINE',
    },
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team');

    let articles = [...FALLBACK_ARTICLES];

    // Try fetching live ESPN NFL feed
    try {
      const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/news', {
        next: { revalidate: 300 }, // Cache for 5 minutes
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.articles && Array.isArray(data.articles)) {
          const liveArticles: NewsArticle[] = data.articles.slice(0, 10).map((item: any, idx: number) => ({
            id: `espn-live-${item.id || idx}`,
            title: item.headline || item.title || 'Breaking NFL News',
            summary: item.description || item.story || '',
            source: 'ESPN',
            author: item.byline || 'ESPN Staff',
            publishedAt: item.published ? new Date(item.published).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
            imageUrl: item.images?.[0]?.url || 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&auto=format&fit=crop&q=60',
            url: item.links?.web?.href || 'https://www.espn.com/nfl',
            tags: ['NFL', 'Breaking'],
            aiSummary: {
              executiveBrief: item.description || 'Live report syndicated from ESPN newsdesk.',
              keyTakeaways: [
                'Live wire breaking news story.',
                'Impacts team depth chart and weekly matchup outlook.'
              ],
              fantasyImpact: 'Monitor practice reports and official injury designations.',
              urgency: 'MEDIUM',
            },
          }));

          if (liveArticles.length > 0) {
            articles = [...liveArticles, ...FALLBACK_ARTICLES];
          }
        }
      }
    } catch (e) {
      console.warn('Live news fetch failed, utilizing resilient fallback:', e);
    }

    if (team) {
      articles = articles.filter(a => a.teamId?.toLowerCase() === team.toLowerCase() || a.tags.some(t => t.toLowerCase() === team.toLowerCase()));
    }

    return NextResponse.json({ articles });
  } catch (error) {
    return NextResponse.json({ articles: FALLBACK_ARTICLES }, { status: 200 });
  }
}
