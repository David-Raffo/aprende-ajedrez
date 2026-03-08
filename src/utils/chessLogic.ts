import { Board, Piece, Position, Move, PieceColor, PieceType } from '@/types/chess';

export const PIECE_SYMBOLS = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙'
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟︎'
  }
};

export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Place pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black' };
    board[6][col] = { type: 'pawn', color: 'white' };
  }
  
  // Place other pieces
  const pieceOrder: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: pieceOrder[col], color: 'black' };
    board[7][col] = { type: pieceOrder[col], color: 'white' };
  }
  
  return board;
}

export function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

export function isOppositePiece(piece1: Piece | null, piece2: Piece | null): boolean {
  return piece1 !== null && piece2 !== null && piece1.color !== piece2.color;
}

export function isSameColorPiece(piece1: Piece | null, piece2: Piece | null): boolean {
  return piece1 !== null && piece2 !== null && piece1.color === piece2.color;
}

export function getPawnMoves(board: Board, position: Position, piece: Piece): Position[] {
  const moves: Position[] = [];
  const { row, col } = position;
  const direction = piece.color === 'white' ? -1 : 1;
  const startRow = piece.color === 'white' ? 6 : 1;
  
  // Forward move
  if (isValidPosition(row + direction, col) && !board[row + direction][col]) {
    moves.push({ row: row + direction, col });
    
    // Double move from starting position
    if (row === startRow && !board[row + 2 * direction][col]) {
      moves.push({ row: row + 2 * direction, col });
    }
  }
  
  // Capture moves
  for (const captureCol of [col - 1, col + 1]) {
    if (isValidPosition(row + direction, captureCol)) {
      const targetPiece = board[row + direction][captureCol];
      if (targetPiece && isOppositePiece(piece, targetPiece)) {
        moves.push({ row: row + direction, col: captureCol });
      }
    }
  }
  
  return moves;
}

export function getRookMoves(board: Board, position: Position, piece: Piece): Position[] {
  const moves: Position[] = [];
  const { row, col } = position;
  
  // Horizontal and vertical directions
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  for (const [dRow, dCol] of directions) {
    for (let i = 1; i < 8; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      
      if (!isValidPosition(newRow, newCol)) break;
      
      const targetPiece = board[newRow][newCol];
      if (!targetPiece) {
        moves.push({ row: newRow, col: newCol });
      } else {
        if (isOppositePiece(piece, targetPiece)) {
          moves.push({ row: newRow, col: newCol });
        }
        break;
      }
    }
  }
  
  return moves;
}

export function getBishopMoves(board: Board, position: Position, piece: Piece): Position[] {
  const moves: Position[] = [];
  const { row, col } = position;
  
  // Diagonal directions
  const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  
  for (const [dRow, dCol] of directions) {
    for (let i = 1; i < 8; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      
      if (!isValidPosition(newRow, newCol)) break;
      
      const targetPiece = board[newRow][newCol];
      if (!targetPiece) {
        moves.push({ row: newRow, col: newCol });
      } else {
        if (isOppositePiece(piece, targetPiece)) {
          moves.push({ row: newRow, col: newCol });
        }
        break;
      }
    }
  }
  
  return moves;
}

export function getKnightMoves(board: Board, position: Position, piece: Piece): Position[] {
  const moves: Position[] = [];
  const { row, col } = position;
  
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  
  for (const [dRow, dCol] of knightMoves) {
    const newRow = row + dRow;
    const newCol = col + dCol;
    
    if (isValidPosition(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (!targetPiece || isOppositePiece(piece, targetPiece)) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }
  
  return moves;
}

export function getQueenMoves(board: Board, position: Position, piece: Piece): Position[] {
  return [...getRookMoves(board, position, piece), ...getBishopMoves(board, position, piece)];
}

export function getKingMoves(board: Board, position: Position, piece: Piece): Position[] {
  const moves: Position[] = [];
  const { row, col } = position;
  
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  for (const [dRow, dCol] of directions) {
    const newRow = row + dRow;
    const newCol = col + dCol;
    
    if (isValidPosition(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (!targetPiece || isOppositePiece(piece, targetPiece)) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }
  
  return moves;
}

export function getPossibleMoves(board: Board, position: Position): Position[] {
  const piece = board[position.row][position.col];
  if (!piece) return [];
  
  switch (piece.type) {
    case 'pawn':
      return getPawnMoves(board, position, piece);
    case 'rook':
      return getRookMoves(board, position, piece);
    case 'bishop':
      return getBishopMoves(board, position, piece);
    case 'knight':
      return getKnightMoves(board, position, piece);
    case 'queen':
      return getQueenMoves(board, position, piece);
    case 'king':
      return getKingMoves(board, position, piece);
    default:
      return [];
  }
}

export function findKing(board: Board, color: PieceColor): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

export function isSquareUnderAttack(board: Board, position: Position, attackingColor: PieceColor): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === attackingColor) {
        const moves = getPossibleMoves(board, { row, col });
        if (moves.some(move => move.row === position.row && move.col === position.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function isInCheck(board: Board, color: PieceColor): boolean {
  const kingPosition = findKing(board, color);
  if (!kingPosition) return false;
  
  const oppositeColor = color === 'white' ? 'black' : 'white';
  return isSquareUnderAttack(board, kingPosition, oppositeColor);
}

export function makeMove(board: Board, from: Position, to: Position): Board {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[from.row][from.col];
  
  if (piece) {
    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;
    
    // Mark piece as moved
    if (newBoard[to.row][to.col]) {
      newBoard[to.row][to.col]!.hasMoved = true;
    }
  }
  
  return newBoard;
}

export function isValidMove(board: Board, from: Position, to: Position): boolean {
  const piece = board[from.row][from.col];
  if (!piece) return false;
  
  const possibleMoves = getPossibleMoves(board, from);
  const isValidDestination = possibleMoves.some(move => move.row === to.row && move.col === to.col);
  
  if (!isValidDestination) return false;
  
  // Check if move would put own king in check
  const testBoard = makeMove(board, from, to);
  return !isInCheck(testBoard, piece.color);
}

export function getAllPossibleMoves(board: Board, color: PieceColor): Position[] {
  const allMoves: Position[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getPossibleMoves(board, { row, col });
        for (const move of moves) {
          if (isValidMove(board, { row, col }, move)) {
            allMoves.push(move);
          }
        }
      }
    }
  }
  
  return allMoves;
}

export function isCheckmate(board: Board, color: PieceColor): boolean {
  return isInCheck(board, color) && getAllPossibleMoves(board, color).length === 0;
}

export function isStalemate(board: Board, color: PieceColor): boolean {
  return !isInCheck(board, color) && getAllPossibleMoves(board, color).length === 0;
}

// Convert board to FEN notation
export function boardToFen(board: Board, currentPlayer: PieceColor): string {
  let fen = '';
  
  // Convert board position
  for (let row = 0; row < 8; row++) {
    let emptyCount = 0;
    let rowFen = '';
    
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      
      if (piece === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rowFen += emptyCount.toString();
          emptyCount = 0;
        }
        
        let pieceChar = '';
        switch (piece.type) {
          case 'king': pieceChar = 'k'; break;
          case 'queen': pieceChar = 'q'; break;
          case 'rook': pieceChar = 'r'; break;
          case 'bishop': pieceChar = 'b'; break;
          case 'knight': pieceChar = 'n'; break;
          case 'pawn': pieceChar = 'p'; break;
        }
        
        if (piece.color === 'white') {
          pieceChar = pieceChar.toUpperCase();
        }
        
        rowFen += pieceChar;
      }
    }
    
    if (emptyCount > 0) {
      rowFen += emptyCount.toString();
    }
    
    fen += rowFen;
    if (row < 7) fen += '/';
  }
  
  // Add active color
  fen += ` ${currentPlayer === 'white' ? 'w' : 'b'}`;
  
  // Add castling availability (simplified - assuming no castling for now)
  fen += ' -';
  
  // Add en passant target square (simplified)
  fen += ' -';
  
  // Add halfmove clock and fullmove number (simplified)
  fen += ' 0 1';
  
  return fen;
}