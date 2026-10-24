export interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
  teamId: string;
  avatarUrl: string;
  status: 'Active' | 'Questionable' | 'Doubtful' | 'Out' | 'IR';
  statsHighlight?: string;
  college?: string;
  experience?: string;
  stats?: Record<string, string | number>;
}

export interface Injury {
  id: string;
  playerName: string;
  position: string;
  teamId: string;
  injury: string;
  injuryType?: string;
  status: 'Active' | 'Questionable' | 'Doubtful' | 'Out' | 'IR';
  lastUpdated: string;
  updatedAt?: string;
  details: string;
  practiceStatus?: string;
  estimatedReturn?: string;
}

export interface GameSchedule {
  week: number;
  date: string;
  time?: string;
  opponent: string;
  opponentLogo: string;
  isHome: boolean;
  timeOrScore: string;
  tvNetwork?: string;
  broadcastNetwork?: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINAL';
  result?: 'W' | 'L' | 'T' | string;
  spread?: string;
}

export interface SeasonHighlight {
  id: string;
  title: string;
  week: number;
  duration: string;
  thumbnailUrl: string;
  videoUrl: string;
  description: string;
  views: string;
  opponent?: string;
}

export interface NFLTeam {
  id: string;
  city: string;
  name: string;
  abbreviation: string;
  conference: 'AFC' | 'NFC';
  division: 'East' | 'North' | 'South' | 'West';
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  logoUrl: string;
  stadium: string;
  record: { wins: number; losses: number; ties: number };
  rankInDivision: string;
  nextGame: {
    week?: number;
    opponent: string;
    opponentAbbr: string;
    opponentLogo: string;
    isHome: boolean;
    date: string;
    time: string;
    network: string;
    broadcastNetwork?: string;
    spread: string;
    stadium: string;
    venue?: string;
    countdownHours: number;
  };
  schedule: GameSchedule[];
  injuries: Injury[];
  highlights: SeasonHighlight[];
  starPlayers: Player[];
}

export interface AISummaryResponse {
  summary: string;
  executiveBrief?: string;
  keyTakeaways: string[];
  fantasyImpact: string;
  urgency: string;
  generatedAt?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: 'Yahoo Sports' | 'ESPN' | 'NFL Insider' | 'Gridiron AI';
  author: string;
  publishedAt: string;
  imageUrl: string;
  url: string;
  tags: string[];
  teamId?: string;
  teamTag?: string;
  category?: string;
  aiSummary?: {
    executiveBrief: string;
    keyTakeaways: string[];
    fantasyImpact: string;
    urgency: 'HIGH' | 'MEDIUM' | 'ROUTINE';
  };
}

export interface UserPreferences {
  favoriteTeamIds: string[];
  primaryTeamId: string;
  favoritePlayerIds: string[];
  favoriteTeams?: string[];
  favoritePlayers?: string[];
  savedArticles?: string[];
  notificationsEnabled?: boolean;
  theme: 'dark' | 'light' | 'midnight';
  hasCompletedOnboarding?: boolean;
}
