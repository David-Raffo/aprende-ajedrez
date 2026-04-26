import { Board, GamePosition, PieceColor, Position } from '@/types/chess';
import { advancePosition, getAllLegalMoves, isInCheck } from './chessLogic';

const PIECE_VALUES = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 1000
};

const PAWN_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [0, 0, 0, 0, 0, 0, 0, 0]
];

const KNIGHT_TABLE = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50]
];

export function evaluatePosition(board: Board, color: PieceColor): number {
  let score = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      let value = PIECE_VALUES[piece.type];
      const tableRow = piece.color === 'white' ? 7 - row : row;
      if (piece.type === 'pawn') value += PAWN_TABLE[tableRow][col] * 0.1;
      if (piece.type === 'knight') value += KNIGHT_TABLE[tableRow][col] * 0.1;
      score += piece.color === color ? value : -value;
    }
  }
  return score;
}

function minimax(position: GamePosition, depth: number, alpha: number, beta: number, color: PieceColor): number {
  const moves = getAllLegalMoves(position);
  const maximizing = position.turn === color;
  if (moves.length === 0) {
    if (!isInCheck(position.board, position.turn)) return 0;
    return maximizing ? -10000 - depth : 10000 + depth;
  }
  if (depth === 0) return evaluatePosition(position.board, color);

  let best = maximizing ? -Infinity : Infinity;
  for (const { from, to } of moves) {
    const score = minimax(advancePosition(position, from, to), depth - 1, alpha, beta, color);
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, score);
    }
    if (beta <= alpha) break;
  }
  return best;
}

export function getBestMove(position: GamePosition, difficulty = 3): { from: Position; to: Position } | null {
  const color = position.turn;
  const depth = Math.max(0, Math.min(difficulty, 4) - 1);
  let bestMove: { from: Position; to: Position } | null = null;
  let bestScore = -Infinity;
  for (const move of getAllLegalMoves(position)) {
    const score = minimax(advancePosition(position, move.from, move.to), depth, -Infinity, Infinity, color);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}
