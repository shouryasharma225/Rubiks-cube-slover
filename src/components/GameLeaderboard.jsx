import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  Zap,
  Timer,
  Award,
  Clock,
  Search,
  User,
  Trash2,
  RotateCcw,
  Share2,
  Check,
  Copy,
  Filter,
  Sparkles,
  Plus,
  Play,
  ArrowUpRight,
  TrendingUp,
  Hash,
  Activity
} from 'lucide-react';

// Format milliseconds as mm:ss.ms
export function formatTimeMs(ms) {
  if (typeof ms !== 'number' || isNaN(ms)) return '--:--.--';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const hundredths = Math.floor((ms % 1000) / 10);
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${pad(minutes)}:${pad(seconds)}.${pad(hundredths)}`;
}

// Initial default hall-of-fame speedcuber records
export const DEFAULT_LEADERBOARD_RECORDS = [
  // Easy (6 moves)
  {
    id: 'rec_easy_1',
    playerName: 'Yiheng Wang',
    isUser: false,
    difficulty: 'easy',
    timeMs: 1840,
    moves: 6,
    tps: 3.26,
    date: '2026-08-14T10:30:00.000Z',
    scramble: "U R' F U2 R' F"
  },
  {
    id: 'rec_easy_2',
    playerName: 'Tymon Kolasiński',
    isUser: false,
    difficulty: 'easy',
    timeMs: 2210,
    moves: 6,
    tps: 2.71,
    date: '2026-08-18T14:15:00.000Z',
    scramble: "R U R' F R2 U'"
  },
  {
    id: 'rec_easy_3',
    playerName: 'Luke Garrett',
    isUser: false,
    difficulty: 'easy',
    timeMs: 2650,
    moves: 7,
    tps: 2.64,
    date: '2026-08-22T09:40:00.000Z',
    scramble: "F R U' R' U F'"
  },
  {
    id: 'rec_easy_4',
    playerName: 'SpeedyBot AI',
    isUser: false,
    difficulty: 'easy',
    timeMs: 3120,
    moves: 6,
    tps: 1.92,
    date: '2026-09-01T16:20:00.000Z',
    scramble: "R' F R U' R' F'"
  },

  // Medium (12 moves)
  {
    id: 'rec_med_1',
    playerName: 'Max Park',
    isUser: false,
    difficulty: 'medium',
    timeMs: 4320,
    moves: 12,
    tps: 2.78,
    date: '2026-08-10T12:00:00.000Z',
    scramble: "R U R' U' R' F R2 U' R' U' R U"
  },
  {
    id: 'rec_med_2',
    playerName: 'Feliks Zemdegs',
    isUser: false,
    difficulty: 'medium',
    timeMs: 4890,
    moves: 13,
    tps: 2.66,
    date: '2026-08-16T18:45:00.000Z',
    scramble: "F R U R' U' F' R U2 R' U' R U' R'"
  },
  {
    id: 'rec_med_3',
    playerName: 'Ruihang Xu',
    isUser: false,
    difficulty: 'medium',
    timeMs: 5410,
    moves: 12,
    tps: 2.22,
    date: '2026-08-25T11:10:00.000Z',
    scramble: "U R U' R' U R U2 R' F R U R' U' F'"
  },
  {
    id: 'rec_med_4',
    playerName: 'CubeNinja99',
    isUser: false,
    difficulty: 'medium',
    timeMs: 6250,
    moves: 14,
    tps: 2.24,
    date: '2026-09-05T08:30:00.000Z',
    scramble: "R U2 R' U' R U2 L' U R' U' L"
  },

  // WCA Standard (22 moves)
  {
    id: 'rec_wca_1',
    playerName: 'Max Park (WR)',
    isUser: false,
    difficulty: 'wca',
    timeMs: 8920,
    moves: 22,
    tps: 2.47,
    date: '2026-07-28T15:20:00.000Z',
    scramble: "B2 L2 D2 U2 B' R2 B' F D2 L2 F2 U' B D' B2 L' F' R' U2 R2 U' B"
  },
  {
    id: 'rec_wca_2',
    playerName: 'Yiheng Wang',
    isUser: false,
    difficulty: 'wca',
    timeMs: 9450,
    moves: 23,
    tps: 2.43,
    date: '2026-08-04T13:00:00.000Z',
    scramble: "D2 F2 R2 U' B2 L2 D' B2 D' F2 U2 F' L U' R' D2 F' D2 L2 B D'"
  },
  {
    id: 'rec_wca_3',
    playerName: 'Tymon Kolasiński',
    isUser: false,
    difficulty: 'wca',
    timeMs: 10180,
    moves: 22,
    tps: 2.16,
    date: '2026-08-19T17:30:00.000Z',
    scramble: "R2 B2 U2 F2 D R2 D' F2 D B2 U' L' B' D' R' F D2 L2 B2 F' U2 R"
  },
  {
    id: 'rec_wca_4',
    playerName: 'Feliks Zemdegs',
    isUser: false,
    difficulty: 'wca',
    timeMs: 11350,
    moves: 24,
    tps: 2.11,
    date: '2026-08-29T21:10:00.000Z',
    scramble: "F2 R2 U2 B2 D2 L' F2 R' B2 L2 U2 F' U' L' D2 B' R2 D' B' R' D"
  }
];

// Helper to get leaderboard from localStorage
export function getSavedLeaderboard() {
  try {
    const raw = localStorage.getItem('rcs_game_leaderboard');
    if (!raw) return DEFAULT_LEADERBOARD_RECORDS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_LEADERBOARD_RECORDS;
  } catch (err) {
    console.warn('Failed reading leaderboard from localStorage', err);
    return DEFAULT_LEADERBOARD_RECORDS;
  }
}

// Helper to save leaderboard
export function saveLeaderboard(records) {
  try {
    localStorage.setItem('rcs_game_leaderboard', JSON.stringify(records));
  } catch (err) {
    console.warn('Failed saving leaderboard to localStorage', err);
  }
}

// Helper to get player alias
export function getPlayerAlias() {
  try {
    return localStorage.getItem('rcs_player_name') || 'SpeedCuber';
  } catch {
    return 'SpeedCuber';
  }
}

export function GameLeaderboard({
  onRaceScramble,
  highlightRecordId,
  currentCategory = 'all'
}) {
  const [records, setRecords] = useState(getSavedLeaderboard);
  const [selectedDifficulty, setSelectedDifficulty] = useState(currentCategory); // 'all' | 'easy' | 'medium' | 'wca'
  const [sortBy, setSortBy] = useState('time'); // 'time' | 'moves' | 'tps' | 'date'
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyMySolves, setOnlyMySolves] = useState(false);

  // Player Nickname Editing
  const [playerName, setPlayerName] = useState(getPlayerAlias);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);

  // Share Notification State
  const [copiedId, setCopiedId] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  // Sync when storage or external records update
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'rcs_game_leaderboard') {
        setRecords(getSavedLeaderboard());
      }
      if (e.key === 'rcs_player_name') {
        const newName = getPlayerAlias();
        setPlayerName(newName);
        setNameInput(newName);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save Player Alias
  const handleSavePlayerName = (e) => {
    e?.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setPlayerName(trimmed);
    setIsEditingName(false);
    try {
      localStorage.setItem('rcs_player_name', trimmed);
      // Also update existing user entries with new name if desired
      const updated = records.map(r => r.isUser ? { ...r, playerName: trimmed } : r);
      setRecords(updated);
      saveLeaderboard(updated);
      showNotice(`Player alias updated to "${trimmed}"`);
    } catch (err) {
      console.warn(err);
    }
  };

  // Helper temporary notice
  const showNotice = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Delete single user record
  const handleDeleteRecord = (id) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    saveLeaderboard(updated);
    showNotice('Record removed from leaderboard');
  };

  // Clear all personal solves
  const handleClearMySolves = () => {
    if (!window.confirm('Are you sure you want to clear all your personal solve records? Benchmark records will remain.')) {
      return;
    }
    const updated = records.filter(r => !r.isUser);
    setRecords(updated);
    saveLeaderboard(updated);
    showNotice('All personal records cleared');
  };

  // Reset to default hall-of-fame records
  const handleResetDefaults = () => {
    if (!window.confirm('Reset leaderboard to default hall-of-fame records? All personal solves will be reset.')) {
      return;
    }
    setRecords(DEFAULT_LEADERBOARD_RECORDS);
    saveLeaderboard(DEFAULT_LEADERBOARD_RECORDS);
    showNotice('Leaderboard reset to default hall-of-fame benchmark records');
  };

  // Simulate a test solve record for demonstration
  const handleSimulateSolve = () => {
    const difficulties = ['easy', 'medium', 'wca'];
    const diff = difficulties[Math.floor(Math.random() * difficulties.length)];
    let timeMs = 2500;
    let moves = 6;
    let scramble = "U R' F U2 R' F";

    if (diff === 'easy') {
      timeMs = Math.round(1800 + Math.random() * 2200);
      moves = 6 + Math.floor(Math.random() * 3);
      scramble = "U R' F U2 R' F";
    } else if (diff === 'medium') {
      timeMs = Math.round(4100 + Math.random() * 3500);
      moves = 12 + Math.floor(Math.random() * 4);
      scramble = "R U R' U' R' F R2 U' R' U' R U";
    } else {
      timeMs = Math.round(8200 + Math.random() * 6000);
      moves = 22 + Math.floor(Math.random() * 6);
      scramble = "B2 L2 D2 U2 B' R2 B' F D2 L2 F2 U' B D' B2 L' F' R' U2 R2 U' B";
    }

    const tps = Number((moves / (timeMs / 1000)).toFixed(2));
    const newEntry = {
      id: `sim_${Date.now()}`,
      playerName: playerName || 'You',
      isUser: true,
      difficulty: diff,
      timeMs,
      moves,
      tps,
      date: new Date().toISOString(),
      scramble
    };

    const updated = [newEntry, ...records];
    setRecords(updated);
    saveLeaderboard(updated);
    showNotice(`Logged demonstration solve: ${formatTimeMs(timeMs)} on ${diff.toUpperCase()}`);
  };

  // Copy solve card to clipboard
  const handleShareRecord = (entry) => {
    const text = `🏆 Rubik's Cube Solve on Antigravity
Player: ${entry.playerName}
Level: ${entry.difficulty.toUpperCase()}
Time: ${formatTimeMs(entry.timeMs)}
Moves: ${entry.moves} (${entry.tps} TPS)
Scramble: ${entry.scramble}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => {
      alert(text);
    });
  };

  // Launch scramble in game arena
  const handleRaceScramble = (entry) => {
    if (typeof onRaceScramble === 'function') {
      onRaceScramble(entry);
      // Smoothly scroll to game arena top
      const gameArenaEl = document.querySelector('.game-mode-section') || document.querySelector('.game-arena-wrapper');
      if (gameArenaEl) {
        gameArenaEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      showNotice(`Loaded scramble into Game Arena for ${entry.difficulty.toUpperCase()}! Ready to solve!`);
    }
  };

  // Filtered and Sorted Records
  const filteredRecords = useMemo(() => {
    return records.filter(entry => {
      // Difficulty filter
      if (selectedDifficulty !== 'all' && entry.difficulty !== selectedDifficulty) {
        return false;
      }
      // Only my solves
      if (onlyMySolves && !entry.isUser) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = entry.playerName.toLowerCase().includes(query);
        const matchesDiff = entry.difficulty.toLowerCase().includes(query);
        if (!matchesName && !matchesDiff) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'time') return a.timeMs - b.timeMs;
      if (sortBy === 'moves') return a.moves - b.moves;
      if (sortBy === 'tps') return b.tps - a.tps;
      if (sortBy === 'date') return new Date(b.date || 0) - new Date(a.date || 0);
      return 0;
    });
  }, [records, selectedDifficulty, onlyMySolves, searchQuery, sortBy]);

  // Overall User Stats
  const userStats = useMemo(() => {
    const userSolves = records.filter(r => r.isUser);
    if (!userSolves.length) {
      return { total: 0, bestTime: null, avgTime: null, maxTps: null };
    }
    const total = userSolves.length;
    const bestTime = Math.min(...userSolves.map(r => r.timeMs));
    const avgTime = Math.round(userSolves.reduce((sum, r) => sum + r.timeMs, 0) / total);
    const maxTps = Math.max(...userSolves.map(r => r.tps || 0));

    return { total, bestTime, avgTime, maxTps };
  }, [records]);

  return (
    <div className="game-leaderboard-card">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="leaderboard-toast">
          <Sparkles size={16} className="toast-sparkle" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="leaderboard-header">
        <div className="leaderboard-title-group">
          <div className="leaderboard-title-row">
            <div className="leaderboard-icon-glow">
              <Trophy size={24} className="trophy-gold" />
            </div>
            <div>
              <h2 className="leaderboard-title">Speedcubing Leaderboard</h2>
              <p className="leaderboard-subtitle">
                Hall of Fame & Personal Records across Easy (6 moves), Medium (12 moves), and WCA Standard (22 moves).
              </p>
            </div>
          </div>
        </div>

        {/* Player Profile & Handle */}
        <div className="leaderboard-player-badge">
          <div className="player-badge-inner">
            <User size={16} className="text-accent" />
            {isEditingName ? (
              <form onSubmit={handleSavePlayerName} className="player-name-form">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={20}
                  className="player-name-input"
                  autoFocus
                  placeholder="Your Name / Handle"
                />
                <button type="submit" className="btn-name-save" title="Save Alias">
                  <Check size={14} />
                </button>
              </form>
            ) : (
              <div className="player-name-display" onClick={() => setIsEditingName(true)}>
                <span className="player-name-label">Player:</span>
                <strong className="player-name-val">{playerName}</strong>
                <span className="btn-name-edit" title="Click to edit nickname">✏️</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="leaderboard-stats-row">
        <div className="lb-stat-card">
          <div className="lb-stat-head">
            <Activity size={15} className="text-accent" />
            <span>My Solves</span>
          </div>
          <div className="lb-stat-value">{userStats.total}</div>
          <div className="lb-stat-sub">Recorded locally</div>
        </div>

        <div className="lb-stat-card">
          <div className="lb-stat-head">
            <Crown size={15} className="trophy-gold" />
            <span>Personal Best (PB)</span>
          </div>
          <div className="lb-stat-value text-accent">
            {formatTimeMs(userStats.bestTime)}
          </div>
          <div className="lb-stat-sub">All-time fastest</div>
        </div>

        <div className="lb-stat-card">
          <div className="lb-stat-head">
            <Clock size={15} className="text-success" />
            <span>Average Time</span>
          </div>
          <div className="lb-stat-value">
            {formatTimeMs(userStats.avgTime)}
          </div>
          <div className="lb-stat-sub">Across all categories</div>
        </div>

        <div className="lb-stat-card">
          <div className="lb-stat-head">
            <Flame size={15} className="text-orange" />
            <span>Top TPS</span>
          </div>
          <div className="lb-stat-value">
            {userStats.maxTps ? `${userStats.maxTps} tps` : '--'}
          </div>
          <div className="lb-stat-sub">Peak turn velocity</div>
        </div>
      </div>

      {/* Controls Bar: Category Tabs & Sort Pills */}
      <div className="leaderboard-controls-bar">
        {/* Category Filter Tabs */}
        <div className="category-pill-group">
          <button
            type="button"
            className={`cat-pill-btn ${selectedDifficulty === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedDifficulty('all')}
          >
            🌟 All Categories
          </button>
          <button
            type="button"
            className={`cat-pill-btn ${selectedDifficulty === 'easy' ? 'active' : ''}`}
            onClick={() => setSelectedDifficulty('easy')}
          >
            🟢 Easy (6 Moves)
          </button>
          <button
            type="button"
            className={`cat-pill-btn ${selectedDifficulty === 'medium' ? 'active' : ''}`}
            onClick={() => setSelectedDifficulty('medium')}
          >
            🟡 Medium (12 Moves)
          </button>
          <button
            type="button"
            className={`cat-pill-btn ${selectedDifficulty === 'wca' ? 'active' : ''}`}
            onClick={() => setSelectedDifficulty('wca')}
          >
            🔴 WCA (22 Moves)
          </button>
        </div>

        {/* Sort Metric Selector */}
        <div className="sort-pill-group">
          <span className="sort-label">Sort:</span>
          <button
            type="button"
            className={`sort-pill ${sortBy === 'time' ? 'active' : ''}`}
            onClick={() => setSortBy('time')}
            title="Sort by fastest solve time"
          >
            <Timer size={13} />
            <span>Fastest</span>
          </button>
          <button
            type="button"
            className={`sort-pill ${sortBy === 'moves' ? 'active' : ''}`}
            onClick={() => setSortBy('moves')}
            title="Sort by fewest moves"
          >
            <Hash size={13} />
            <span>Fewest Moves</span>
          </button>
          <button
            type="button"
            className={`sort-pill ${sortBy === 'tps' ? 'active' : ''}`}
            onClick={() => setSortBy('tps')}
            title="Sort by highest turns per second"
          >
            <Flame size={13} />
            <span>Highest TPS</span>
          </button>
          <button
            type="button"
            className={`sort-pill ${sortBy === 'date' ? 'active' : ''}`}
            onClick={() => setSortBy('date')}
            title="Sort by most recent solve"
          >
            <Clock size={13} />
            <span>Recent</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon: Search, Only My Solves, Quick Tools */}
      <div className="leaderboard-filter-ribbon">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search speedcuber name..."
            className="search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>

        <label className="only-user-checkbox">
          <input
            type="checkbox"
            checked={onlyMySolves}
            onChange={(e) => setOnlyMySolves(e.target.checked)}
          />
          <span>Only My Solves ({userStats.total})</span>
        </label>

        <div className="table-actions-right">
          <button
            type="button"
            className="btn-lb-action"
            onClick={handleSimulateSolve}
            title="Add a sample solve to demonstrate leaderboard ranking"
          >
            <Plus size={14} />
            <span>+ Test Solve</span>
          </button>

          {userStats.total > 0 && (
            <button
              type="button"
              className="btn-lb-action btn-danger-action"
              onClick={handleClearMySolves}
              title="Clear only my recorded solves"
            >
              <Trash2 size={14} />
              <span>Clear My Solves</span>
            </button>
          )}

          <button
            type="button"
            className="btn-lb-action"
            onClick={handleResetDefaults}
            title="Restore default speedcuber records"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="leaderboard-table-container">
        {filteredRecords.length === 0 ? (
          <div className="leaderboard-empty-state">
            <Trophy size={42} className="empty-trophy text-muted" />
            <h3>No solves found</h3>
            <p>
              {onlyMySolves
                ? "You haven't completed any solves in this category yet. Scramble the cube in the Game Arena and solve it to record your time!"
                : "No leaderboard entries match your active filters. Try clearing your search or switching categories."}
            </p>
            {onlyMySolves && (
              <button
                type="button"
                className="btn-empty-action"
                onClick={() => setOnlyMySolves(false)}
              >
                Show All Records
              </button>
            )}
          </div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className="th-rank">Rank</th>
                <th className="th-player">Speedcuber</th>
                <th className="th-category">Difficulty</th>
                <th className="th-time">Time</th>
                <th className="th-moves">Moves</th>
                <th className="th-tps">TPS</th>
                <th className="th-date">Date</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((entry, idx) => {
                const rank = idx + 1;
                const isTop1 = rank === 1;
                const isTop2 = rank === 2;
                const isTop3 = rank === 3;
                const isHighlighted = entry.id === highlightRecordId;

                const diffBadgeClass =
                  entry.difficulty === 'easy'
                    ? 'diff-badge-easy'
                    : entry.difficulty === 'medium'
                    ? 'diff-badge-medium'
                    : 'diff-badge-wca';

                const diffLabel =
                  entry.difficulty === 'easy'
                    ? 'Easy (6)'
                    : entry.difficulty === 'medium'
                    ? 'Medium (12)'
                    : 'WCA (22)';

                const dateFormatted = entry.date
                  ? new Date(entry.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'Benchmark';

                return (
                  <tr
                    key={entry.id}
                    className={`lb-row ${entry.isUser ? 'user-row' : ''} ${isHighlighted ? 'row-highlight' : ''}`}
                  >
                    {/* Rank Badge */}
                    <td className="td-rank">
                      <div className="rank-cell-wrapper">
                        {isTop1 ? (
                          <div className="rank-badge rank-1" title="1st Place (Gold)">
                            <Crown size={15} />
                            <span>1</span>
                          </div>
                        ) : isTop2 ? (
                          <div className="rank-badge rank-2" title="2nd Place (Silver)">
                            <Medal size={15} />
                            <span>2</span>
                          </div>
                        ) : isTop3 ? (
                          <div className="rank-badge rank-3" title="3rd Place (Bronze)">
                            <Medal size={15} />
                            <span>3</span>
                          </div>
                        ) : (
                          <div className="rank-badge rank-standard">
                            #{rank}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Player Info */}
                    <td className="td-player">
                      <div className="player-info-cell">
                        <div className={`player-avatar-circle ${entry.isUser ? 'avatar-user' : ''}`}>
                          {entry.isUser ? '👤' : entry.playerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="player-name-col">
                          <div className="player-name-title">
                            <span className="name-text">{entry.playerName}</span>
                            {entry.isUser && (
                              <span className="you-badge" title="Your recorded solve">
                                YOU
                              </span>
                            )}
                          </div>
                          {entry.scramble && (
                            <span className="scramble-preview" title={`Scramble: ${entry.scramble}`}>
                              {entry.scramble.length > 25 ? `${entry.scramble.slice(0, 25)}…` : entry.scramble}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Difficulty */}
                    <td className="td-category">
                      <span className={`diff-tag ${diffBadgeClass}`}>
                        {diffLabel}
                      </span>
                    </td>

                    {/* Time */}
                    <td className="td-time">
                      <span className="time-val-mono">
                        {formatTimeMs(entry.timeMs)}
                      </span>
                    </td>

                    {/* Moves */}
                    <td className="td-moves">
                      <span className="moves-count-val">{entry.moves}</span>
                    </td>

                    {/* TPS */}
                    <td className="td-tps">
                      <div className="tps-cell">
                        <Flame size={13} className="text-orange" />
                        <span>{entry.tps}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="td-date">
                      <span className="date-text">{dateFormatted}</span>
                    </td>

                    {/* Actions */}
                    <td className="td-actions">
                      <div className="action-buttons-group">
                        {entry.scramble && (
                          <button
                            type="button"
                            className="btn-row-action btn-race"
                            onClick={() => handleRaceScramble(entry)}
                            title="Race against this exact scramble in the Game Arena!"
                          >
                            <Play size={13} />
                            <span>Race</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-row-action btn-share"
                          onClick={() => handleShareRecord(entry)}
                          title="Copy solve result to clipboard"
                        >
                          {copiedId === entry.id ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                        </button>

                        {entry.isUser && (
                          <button
                            type="button"
                            className="btn-row-action btn-delete"
                            onClick={() => handleDeleteRecord(entry.id)}
                            title="Delete this personal record"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Info */}
      <div className="leaderboard-footer">
        <div className="footer-tip">
          <Sparkles size={14} className="text-accent" />
          <span>
            Tip: Complete solves in the Game Arena to automatically rank your times. Click <strong>"Race"</strong> on any competitor to load their exact scramble!
          </span>
        </div>
        <div className="footer-count">
          Showing {filteredRecords.length} of {records.length} records
        </div>
      </div>
    </div>
  );
}
