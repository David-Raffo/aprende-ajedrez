export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceColor = 'white' | 'black';
export type PromotionPiece = 'queen' | 'rook' | 'bishop' | 'knight';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export type Board = (Piece | null)[][];

export interface GamePosition {
  board: Board;
  turn: PieceColor;
  enPassant: Position | null;
  halfmoveClock: number;
  fullmoveNumber: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  isSpecialMove?: 'castling' | 'enPassant' | 'promotion';
  promotion?: PromotionPiece;
  san: string;
}

export type DrawReason = 'stalemate' | 'insufficient-material' | 'fifty-moves';

export interface GameState {
  position: GamePosition;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  drawReason: DrawReason | null;
  gameOver: boolean;
  winner: PieceColor | null;
  moveHistory: Move[];
  selectedSquare: Position | null;
  validMoves: Position[];
}
