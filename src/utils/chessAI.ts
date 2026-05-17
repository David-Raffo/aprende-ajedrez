import { Board, GamePosition, PieceColor, PieceType, Position } from '@/types/chess';
import { advancePosition, getAllLegalMoves, isInCheck, isPromotionMove } from './chessLogic';

export type AiMove = { from: Position; to: Position };

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 0
};

const PST: Record<PieceType, number[][]> = {
  pawn: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ],
  knight: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50]
  ],
  bishop: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20]
  ],
  rook: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0]
  ],
  queen: [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20]
  ],
  king: [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20]
  ]
};

const KING_ENDGAME = [
  [-50, -40, -30, -20, -20, -30, -40, -50],
  [-30, -20, -10, 0, 0, -10, -20, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -30, 0, 0, 0, 0, -30, -30],
  [-50, -30, -30, -30, -30, -30, -30, -50]
];

const MATE_SCORE = 100000;

export const DIFFICULTY_SETTINGS: Record<number, { depth: number; timeMs: number; tolerance: number }> = {
  1: { depth: 1, timeMs: 300, tolerance: 150 },
  2: { depth: 2, timeMs: 600, tolerance: 40 },
  3: { depth: 3, timeMs: 1200, tolerance: 0 },
  4: { depth: 4, timeMs: 2000, tolerance: 0 },
  5: { depth: 6, timeMs: 3000, tolerance: 0 }
};

class SearchTimeout extends Error {}

function isEndgame(board: Board) {
  let material = 0;
  for (const row of board) {
    for (const piece of row) {
      if (piece && piece.type !== 'king' && piece.type !== 'pawn') material += PIECE_VALUES[piece.type];
    }
  }
  return material <= 1300;
}

export function evaluatePosition(board: Board, color: PieceColor): number {
  const endgame = isEndgame(board);
  let score = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      const tableRow = piece.color === 'white' ? row : 7 - row;
      const table = piece.type === 'king' && endgame ? KING_ENDGAME : PST[piece.type];
      const value = PIECE_VALUES[piece.type] + table[tableRow][col];
      score += piece.color === color ? value : -value;
    }
  }
  return score;
}

function moveScore(position: GamePosition, move: AiMove) {
  const attacker = position.board[move.from.row][move.from.col];
  const victim = position.board[move.to.row][move.to.col];
  let score = 0;
  if (victim && attacker) score += 10 * PIECE_VALUES[victim.type] - PIECE_VALUES[attacker.type] + 10000;
  if (isPromotionMove(position.board, move.from, move.to)) score += 9000;
  return score;
}

const orderMoves = (position: GamePosition, moves: AiMove[]) =>
  moves
    .map(move => ({ move, score: moveScore(position, move) }))
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.move);

class Searcher {
  private nodes = 0;

  constructor(private readonly deadline: number) {}

  private tick() {
    if (++this.nodes % 2048 === 0 && performance.now() > this.deadline) throw new SearchTimeout();
  }

  quiescence(position: GamePosition, alpha: number, beta: number, depth = 0): number {
    this.tick();
    const standPat = evaluatePosition(position.board, position.turn);
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
    if (depth >= 6) return alpha;
    const captures = getAllLegalMoves(position).filter(move => position.board[move.to.row][move.to.col]);
    for (const move of orderMoves(position, captures)) {
      const score = -this.quiescence(advancePosition(position, move.from, move.to), -beta, -alpha, depth + 1);
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  negamax(position: GamePosition, depth: number, alpha: number, beta: number, ply: number): number {
    this.tick();
    const moves = getAllLegalMoves(position);
    if (moves.length === 0) return isInCheck(position.board, position.turn) ? -MATE_SCORE + ply : 0;
    if (position.halfmoveClock >= 100) return 0;
    if (depth === 0) return this.quiescence(position, alpha, beta);

    for (const move of orderMoves(position, moves)) {
      const score = -this.negamax(advancePosition(position, move.from, move.to), depth - 1, -beta, -alpha, ply + 1);
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  searchRoot(position: GamePosition, depth: number, moves: AiMove[], exact: boolean) {
    const scored: { move: AiMove; score: number }[] = [];
    let alpha = -Infinity;
    for (const move of moves) {
      const next = advancePosition(position, move.from, move.to);
      const score = -this.negamax(next, depth - 1, -Infinity, exact ? Infinity : -alpha + 1, 1);
      scored.push({ move, score });
      if (score > alpha) alpha = score;
    }
    return scored.sort((a, b) => b.score - a.score);
  }
}

export function getBestMove(position: GamePosition, difficulty = 3, random = Math.random): AiMove | null {
  const settings = DIFFICULTY_SETTINGS[difficulty] ?? DIFFICULTY_SETTINGS[3];
  const legal = getAllLegalMoves(position);
  if (legal.length === 0) return null;
  if (legal.length === 1) return legal[0];

  const searcher = new Searcher(performance.now() + settings.timeMs);
  let moves = orderMoves(position, legal);
  let ranked: { move: AiMove; score: number }[] = moves.map(move => ({ move, score: 0 }));

  for (let depth = 1; depth <= settings.depth; depth++) {
    try {
      ranked = searcher.searchRoot(position, depth, moves, settings.tolerance > 0);
      moves = ranked.map(entry => entry.move);
      if (Math.abs(ranked[0].score) > MATE_SCORE - 100) break;
    } catch (error) {
      if (error instanceof SearchTimeout) break;
      throw error;
    }
  }

  const best = ranked[0].score;
  const candidates = ranked.filter(entry => best - entry.score <= settings.tolerance);
  return candidates[Math.floor(random() * candidates.length)].move;
}
