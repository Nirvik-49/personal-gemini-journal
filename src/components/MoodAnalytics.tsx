import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Smile,
  Activity,
  Tag,
  Sparkles,
  BarChart2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { JournalEntry } from '../types';

interface MoodAnalyticsProps {
  entries: JournalEntry[];
  selectedMood: string;
  onSelectMood: (mood: string) => void;
}

interface SentimentDataPoint {
  id: string;
  date: string;
  fullDate: string;
  title: string;
  mood: string;
  score: number; // 0 to 100
  sentimentType: 'positive' | 'reflective' | 'challenging';
  sentimentLabel: string;
}

// Map emotional tags to sentiment scores and categories
export function evaluateSentiment(mood: string): {
  score: number;
  type: 'positive' | 'reflective' | 'challenging';
  label: string;
  color: string;
} {
  const m = (mood || '').toLowerCase().trim();

  // Positive & Uplifting
  if (
    m.includes('grate') ||
    m.includes('peace') ||
    m.includes('hope') ||
    m.includes('joy') ||
    m.includes('focus') ||
    m.includes('energ') ||
    m.includes('inspire') ||
    m.includes('content') ||
    m.includes('calm') ||
    m.includes('optimis') ||
    m.includes('relie') ||
    m.includes('resilien') ||
    m.includes('confiden') ||
    m.includes('happy') ||
    m.includes('proud') ||
    m.includes('lov')
  ) {
    return {
      score: 85,
      type: 'positive',
      label: 'Positive / Uplifting',
      color: '#10B981',
    };
  }

  // Challenging & Vulnerable
  if (
    m.includes('anxi') ||
    m.includes('overwhelm') ||
    m.includes('stress') ||
    m.includes('sad') ||
    m.includes('exhaust') ||
    m.includes('frustrat') ||
    m.includes('lone') ||
    m.includes('doubt') ||
    m.includes('worr') ||
    m.includes('burn') ||
    m.includes('grief') ||
    m.includes('fear')
  ) {
    return {
      score: 25,
      type: 'challenging',
      label: 'Challenging / Processing',
      color: '#F59E0B',
    };
  }

  // Default: Reflective & Grounded
  return {
    score: 55,
    type: 'reflective',
    label: 'Reflective / Introspective',
    color: '#7C3AED',
  };
}

export const MoodAnalytics: React.FC<MoodAnalyticsProps> = ({
  entries,
  selectedMood,
  onSelectMood,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Extract emotional tags frequency and counts
  const emotionalTagsSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      const mood = e.mood?.trim();
      if (mood) {
        counts[mood] = (counts[mood] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / (entries.length || 1)) * 100),
        sentiment: evaluateSentiment(name),
      }))
      .sort((a, b) => b.count - a.count);
  }, [entries]);

  // Build chronological sentiment trend data
  const trendData: SentimentDataPoint[] = useMemo(() => {
    const sorted = [...entries].sort(
      (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );

    return sorted.map((entry) => {
      const sentiment = evaluateSentiment(entry.mood || 'Reflective');
      const dateObj = new Date(entry.updatedAt);
      return {
        id: entry.id,
        date: dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        fullDate: dateObj.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        title: entry.title || 'Untitled Reflection',
        mood: entry.mood || 'Reflective',
        score: sentiment.score,
        sentimentType: sentiment.type,
        sentimentLabel: sentiment.label,
      };
    });
  }, [entries]);

  // Calculate sentiment distribution statistics
  const stats = useMemo(() => {
    if (entries.length === 0) {
      return { positive: 0, reflective: 0, challenging: 0, topMood: 'None', trendDesc: 'No entries' };
    }

    let pos = 0;
    let ref = 0;
    let cha = 0;

    trendData.forEach((d) => {
      if (d.sentimentType === 'positive') pos++;
      else if (d.sentimentType === 'challenging') cha++;
      else ref++;
    });

    const total = entries.length;
    const topMood = emotionalTagsSummary[0]?.name || 'Reflective';

    // Calculate trajectory between first half and second half
    let trendDesc = 'Balanced and centered';
    if (trendData.length >= 2) {
      const mid = Math.floor(trendData.length / 2);
      const earlyAvg =
        trendData.slice(0, mid).reduce((acc, d) => acc + d.score, 0) / (mid || 1);
      const recentAvg =
        trendData.slice(mid).reduce((acc, d) => acc + d.score, 0) / (trendData.length - mid || 1);

      if (recentAvg - earlyAvg > 10) {
        trendDesc = 'Trending uplifting & positive';
      } else if (earlyAvg - recentAvg > 10) {
        trendDesc = 'Processing deeper challenges';
      } else {
        trendDesc = 'Consistently grounded & thoughtful';
      }
    }

    return {
      positive: Math.round((pos / total) * 100),
      reflective: Math.round((ref / total) * 100),
      challenging: Math.round((cha / total) * 100),
      topMood,
      trendDesc,
    };
  }, [entries.length, trendData, emotionalTagsSummary]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-[#EEEEEE] rounded-2xl p-5 shadow-2xs mb-6 overflow-hidden transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center border border-[#EDE9FE]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">
                Mood Analytics & Sentiment Tracker
              </h3>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#7C3AED]">
                {entries.length} {entries.length === 1 ? 'Reflection' : 'Reflections'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Emotional tag distribution and chronological sentiment trajectory
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-[#F3F4F6] rounded-lg transition-colors cursor-pointer"
          title={isExpanded ? 'Collapse analytics' : 'Expand analytics'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <div className="bg-[#F9F9FB] border border-[#EEEEEE] rounded-xl p-3">
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider block mb-1">
            Top Dominant Mood
          </span>
          <div className="flex items-center gap-1.5">
            <Smile className="w-4 h-4 text-[#7C3AED]" />
            <span className="text-xs font-semibold text-[#1A1A1A] truncate">
              {stats.topMood}
            </span>
          </div>
        </div>

        <div className="bg-[#F9F9FB] border border-[#EEEEEE] rounded-xl p-3">
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider block mb-1">
            Uplifting / Positive
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-[#1A1A1A]">{stats.positive}%</span>
            <span className="text-[10px] text-gray-400">of logs</span>
          </div>
        </div>

        <div className="bg-[#F9F9FB] border border-[#EEEEEE] rounded-xl p-3">
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider block mb-1">
            Reflective / Neutral
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
            <span className="text-xs font-semibold text-[#1A1A1A]">{stats.reflective}%</span>
            <span className="text-[10px] text-gray-400">of logs</span>
          </div>
        </div>

        <div className="bg-[#F9F9FB] border border-[#EEEEEE] rounded-xl p-3">
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider block mb-1">
            Sentiment Arc
          </span>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span className="text-xs font-semibold text-[#1A1A1A] truncate">
              {stats.trendDesc}
            </span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Visual Sentiment Trend Chart */}
          <div className="bg-[#F9F9FB] border border-[#EEEEEE] rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-[#7C3AED]" />
                Sentiment Trajectory Over Time
              </span>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Uplifting
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED]" /> Reflective
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Processing
                </span>
              </div>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 12, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEEEEE" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[25, 55, 85]}
                    tickFormatter={(val) =>
                      val === 85 ? 'High' : val === 55 ? 'Mid' : 'Deep'
                    }
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as SentimentDataPoint;
                        return (
                          <div className="bg-white border border-[#EEEEEE] rounded-xl p-3 shadow-lg text-xs space-y-1 z-50">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-semibold text-[#1A1A1A] line-clamp-1">
                                {data.title}
                              </span>
                              <span className="text-[10px] text-gray-400 shrink-0">
                                {data.fullDate}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 pt-1">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    data.sentimentType === 'positive'
                                      ? '#10B981'
                                      : data.sentimentType === 'challenging'
                                      ? '#F59E0B'
                                      : '#7C3AED',
                                }}
                              />
                              <span className="font-medium text-gray-700">Mood: {data.mood}</span>
                              <span className="text-[10px] text-gray-400">
                                ({data.sentimentLabel})
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={55} stroke="#E5E7EB" strokeDasharray="2 2" />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#7C3AED"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#sentimentGradient)"
                    activeDot={{ r: 5, stroke: '#7C3AED', strokeWidth: 2, fill: '#FFFFFF' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Extracted Emotional Tags Cloud */}
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-2">
              Extracted Emotional Tags (Click tag to filter archive):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => onSelectMood('all')}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedMood === 'all'
                    ? 'bg-[#1A1A1A] text-white font-medium'
                    : 'bg-[#F9F9FB] text-gray-600 hover:bg-[#F3F4F6] border border-[#EEEEEE]'
                }`}
              >
                <span>All Emotional Tags</span>
                <span className="text-[10px] opacity-70">({entries.length})</span>
              </button>

              {emotionalTagsSummary.map((item) => {
                const isSelected = selectedMood.toLowerCase() === item.name.toLowerCase();
                return (
                  <button
                    key={item.name}
                    onClick={() => onSelectMood(item.name)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#7C3AED] text-white font-medium shadow-xs'
                        : 'bg-[#F9F9FB] text-gray-700 hover:bg-[#F3F4F6] border border-[#EEEEEE]'
                    }`}
                  >
                    <Tag
                      className={`w-2.5 h-2.5 ${isSelected ? 'text-white' : 'text-gray-400'}`}
                    />
                    <span>{item.name}</span>
                    <span
                      className={`text-[10px] px-1 rounded ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-white text-gray-500 border border-[#EEEEEE]'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
