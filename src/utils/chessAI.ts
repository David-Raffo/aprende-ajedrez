import { Board, Position, PieceColor, Piece } from '@/types/chess';
import { 
  getPossibleMoves, 
  makeMove, 
  isValidMove, 
  isInCheck, 
  isCheckmate 
} from './chessLogic';

// Piece values for evaluation
const PIECE_VALUES = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 1000
};

// Position bonus tables (simplified)
const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

export function evaluatePosition(board: Board, color: PieceColor): number {
  let score = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        let pieceValue = PIECE_VALUES[piece.type];
        
        // Add positional bonuses
        if (piece.type === 'pawn') {
          const tableRow = piece.color === 'white' ? 7 - row : row;
          pieceValue += PAWN_TABLE[tableRow][col] * 0.1;
        } else if (piece.type === 'knight') {
          const tableRow = piece.color === 'white' ? 7 - row : row;
          pieceValue += KNIGHT_TABLE[tableRow][col] * 0.1;
        }
        
        // King safety bonus/penalty
        if (piece.type === 'king' && isInCheck(board, piece.color)) {
          pieceValue -= 50;
        }
        
        if (piece.color === color) {
          score += pieceValue;
        } else {
          score -= pieceValue;
        }
      }
    }
  }
  
  return score;
}

export function minimax(
  board: Board, 
  depth: number, 
  isMaximizingPlayer: boolean, 
  alpha: number, 
  beta: number, 
  color: PieceColor
): number {
  if (depth === 0) {
    return evaluatePosition(board, color);
  }
  
  const currentColor = isMaximizingPlayer ? color : (color === 'white' ? 'black' : 'white');
  
  if (isCheckmate(board, currentColor)) {
    return isMaximizingPlayer ? -10000 : 10000;
  }
  
  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          const moves = getPossibleMoves(board, { row, col });
          
          for (const move of moves) {
            if (isValidMove(board, { row, col }, move)) {
              const newBoard = makeMove(board, { row, col }, move);
              const eval_ = minimax(newBoard, depth - 1, false, alpha, beta, color);
              maxEval = Math.max(maxEval, eval_);
              alpha = Math.max(alpha, eval_);
              
              if (beta <= alpha) {
                break;
              }
            }
          }
        }
      }
    }
    
    return maxEval;
  } else {
    let minEval = Infinity;
    const oppositeColor = color === 'white' ? 'black' : 'white';
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === oppositeColor) {
          const moves = getPossibleMoves(board, { row, col });
          
          for (const move of moves) {
            if (isValidMove(board, { row, col }, move)) {
              const newBoard = makeMove(board, { row, col }, move);
              const eval_ = minimax(newBoard, depth - 1, true, alpha, beta, color);
              minEval = Math.min(minEval, eval_);
              beta = Math.min(beta, eval_);
              
              if (beta <= alpha) {
                break;
              }
            }
          }
        }
      }
    }
    
    return minEval;
  }
}

export function getBestMove(board: Board, color: PieceColor, difficulty: number = 3): { from: Position; to: Position } | null {
  let bestMove: { from: Position; to: Position } | null = null;
  let bestEval = -Infinity;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getPossibleMoves(board, { row, col });
        
        for (const move of moves) {
          if (isValidMove(board, { row, col }, move)) {
            const newBoard = makeMove(board, { row, col }, move);
            const eval_ = minimax(newBoard, difficulty, false, -Infinity, Infinity, color);
            
            if (eval_ > bestEval) {
              bestEval = eval_;
              bestMove = { from: { row, col }, to: move };
            }
          }
        }
      }
    }
  }
  
  return bestMove;
}