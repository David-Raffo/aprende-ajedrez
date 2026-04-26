import {
  Board,
  DrawReason,
  GamePosition,
  Move,
  Piece,
  PieceColor,
  PieceType,
  Position,
  PromotionPiece
} from '@/types/chess';

export const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
  black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟︎' }
};

const BACK_RANK: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
const KNIGHT_STEPS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING_STEPS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const ROOK_DIRECTIONS = [[0, 1], [0, -1], [1, 0], [-1, 0]];
const BISHOP_DIRECTIONS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const SAN_LETTERS: Record<PieceType, string> = { king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: '' };
const FEN_LETTERS: Record<PieceType, string> = { king: 'k', queen: 'q', rook: 'r', bishop: 'b', knight: 'n', pawn: 'p' };
const FEN_PIECES: Record<string, PieceType> = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' };

export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const opposite = (color: PieceColor): PieceColor => (color === 'white' ? 'black' : 'white');

export const isValidPosition = (row: number, col: number) => row >= 0 && row < 8 && col >= 0 && col < 8;

export const samePosition = (a: Position | null | undefined, b: Position | null | undefined) =>
  !!a && !!b && a.row === b.row && a.col === b.col;

export const squareName = ({ row, col }: Position) => `${String.fromCharCode(97 + col)}${8 - row}`;

export const parseSquare = (name: string): Position => ({ row: 8 - Number(name[1]), col: name.charCodeAt(0) - 97 });

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: BACK_RANK[col], color: 'black' };
    board[1][col] = { type: 'pawn', color: 'black' };
    board[6][col] = { type: 'pawn', color: 'white' };
    board[7][col] = { type: BACK_RANK[col], color: 'white' };
  }
  return board;
}

export const createInitialPosition = (): GamePosition => ({
  board: createInitialBoard(),
  turn: 'white',
  enPassant: null,
  halfmoveClock: 0,
  fullmoveNumber: 1
});

export function findKing(board: Board, color: PieceColor): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) return { row, col };
    }
  }
  return null;
}

export function isSquareAttacked(board: Board, { row, col }: Position, by: PieceColor): boolean {
  const pawnRow = by === 'white' ? row + 1 : row - 1;
  for (const dc of [-1, 1]) {
    if (isValidPosition(pawnRow, col + dc)) {
      const piece = board[pawnRow][col + dc];
      if (piece && piece.color === by && piece.type === 'pawn') return true;
    }
  }
  for (const [dr, dc] of KNIGHT_STEPS) {
    const r = row + dr;
    const c = col + dc;
    if (isValidPosition(r, c)) {
      const piece = board[r][c];
      if (piece && piece.color === by && piece.type === 'knight') return true;
    }
  }
  for (const [dr, dc] of KING_STEPS) {
    const r = row + dr;
    const c = col + dc;
    if (isValidPosition(r, c)) {
      const piece = board[r][c];
      if (piece && piece.color === by && piece.type === 'king') return true;
    }
  }
  const slides: [number[][], PieceType][] = [[ROOK_DIRECTIONS, 'rook'], [BISHOP_DIRECTIONS, 'bishop']];
  for (const [directions, slider] of slides) {
    for (const [dr, dc] of directions) {
      let r = row + dr;
      let c = col + dc;
      while (isValidPosition(r, c)) {
        const piece = board[r][c];
        if (piece) {
          if (piece.color === by && (piece.type === slider || piece.type === 'queen')) return true;
          break;
        }
        r += dr;
        c += dc;
      }
    }
  }
  return false;
}

export function isInCheck(board: Board, color: PieceColor): boolean {
  const king = findKing(board, color);
  return king !== null && isSquareAttacked(board, king, opposite(color));
}

function slidingMoves(board: Board, from: Position, piece: Piece, directions: number[][], moves: Position[]) {
  for (const [dr, dc] of directions) {
    let r = from.row + dr;
    let c = from.col + dc;
    while (isValidPosition(r, c)) {
      const target = board[r][c];
      if (!target) {
        moves.push({ row: r, col: c });
      } else {
        if (target.color !== piece.color) moves.push({ row: r, col: c });
        break;
      }
      r += dr;
      c += dc;
    }
  }
}

function stepMoves(board: Board, from: Position, piece: Piece, steps: number[][], moves: Position[]) {
  for (const [dr, dc] of steps) {
    const r = from.row + dr;
    const c = from.col + dc;
    if (!isValidPosition(r, c)) continue;
    const target = board[r][c];
    if (!target || target.color !== piece.color) moves.push({ row: r, col: c });
  }
}

function castlingMoves(board: Board, from: Position, piece: Piece, moves: Position[]) {
  const homeRow = piece.color === 'white' ? 7 : 0;
  if (piece.hasMoved || from.row !== homeRow || from.col !== 4) return;
  const enemy = opposite(piece.color);
  if (isSquareAttacked(board, from, enemy)) return;
  const sides = [
    { rookCol: 7, empty: [5, 6], safe: [5, 6], target: 6 },
    { rookCol: 0, empty: [1, 2, 3], safe: [3, 2], target: 2 }
  ];
  for (const side of sides) {
    const rook = board[homeRow][side.rookCol];
    if (!rook || rook.type !== 'rook' || rook.color !== piece.color || rook.hasMoved) continue;
    if (side.empty.some(col => board[homeRow][col])) continue;
    if (side.safe.some(col => isSquareAttacked(board, { row: homeRow, col }, enemy))) continue;
    moves.push({ row: homeRow, col: side.target });
  }
}

function pawnMoves(position: GamePosition, from: Position, piece: Piece, moves: Position[]) {
  const { board, enPassant } = position;
  const direction = piece.color === 'white' ? -1 : 1;
  const startRow = piece.color === 'white' ? 6 : 1;
  const oneStep = from.row + direction;
  if (isValidPosition(oneStep, from.col) && !board[oneStep][from.col]) {
    moves.push({ row: oneStep, col: from.col });
    const twoSteps = from.row + 2 * direction;
    if (from.row === startRow && !board[twoSteps][from.col]) moves.push({ row: twoSteps, col: from.col });
  }
  for (const dc of [-1, 1]) {
    const c = from.col + dc;
    if (!isValidPosition(oneStep, c)) continue;
    const target = board[oneStep][c];
    if ((target && target.color !== piece.color) || samePosition(enPassant, { row: oneStep, col: c })) {
      moves.push({ row: oneStep, col: c });
    }
  }
}

export function getPseudoLegalMoves(position: GamePosition, from: Position): Position[] {
  const piece = position.board[from.row][from.col];
  if (!piece) return [];
  const moves: Position[] = [];
  switch (piece.type) {
    case 'pawn':
      pawnMoves(position, from, piece, moves);
      break;
    case 'knight':
      stepMoves(position.board, from, piece, KNIGHT_STEPS, moves);
      break;
    case 'bishop':
      slidingMoves(position.board, from, piece, BISHOP_DIRECTIONS, moves);
      break;
    case 'rook':
      slidingMoves(position.board, from, piece, ROOK_DIRECTIONS, moves);
      break;
    case 'queen':
      slidingMoves(position.board, from, piece, [...ROOK_DIRECTIONS, ...BISHOP_DIRECTIONS], moves);
      break;
    case 'king':
      stepMoves(position.board, from, piece, KING_STEPS, moves);
      castlingMoves(position.board, from, piece, moves);
      break;
  }
  return moves;
}

export function makeBoardMove(board: Board, from: Position, to: Position, promotion: PromotionPiece = 'queen'): Board {
  const next = board.map(row => [...row]);
  const piece = next[from.row][from.col];
  if (!piece) return next;
  const moved: Piece = { ...piece, hasMoved: true };

  if (piece.type === 'pawn' && from.col !== to.col && !next[to.row][to.col]) {
    next[from.row][to.col] = null;
  }
  if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
    const rookFrom = to.col > from.col ? 7 : 0;
    const rookTo = to.col > from.col ? 5 : 3;
    const rook = next[from.row][rookFrom];
    next[from.row][rookTo] = rook ? { ...rook, hasMoved: true } : null;
    next[from.row][rookFrom] = null;
  }
  if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
    moved.type = promotion;
  }

  next[to.row][to.col] = moved;
  next[from.row][from.col] = null;
  return next;
}

export function getLegalMoves(position: GamePosition, from: Position): Position[] {
  const piece = position.board[from.row][from.col];
  if (!piece) return [];
  return getPseudoLegalMoves(position, from).filter(
    to => !isInCheck(makeBoardMove(position.board, from, to), piece.color)
  );
}

export function isLegalMove(position: GamePosition, from: Position, to: Position): boolean {
  const piece = position.board[from.row][from.col];
  if (!piece || piece.color !== position.turn) return false;
  return getLegalMoves(position, from).some(move => samePosition(move, to));
}

export function getAllLegalMoves(position: GamePosition): { from: Position; to: Position }[] {
  const moves: { from: Position; to: Position }[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = position.board[row][col];
      if (piece && piece.color === position.turn) {
        const from = { row, col };
        for (const to of getLegalMoves(position, from)) moves.push({ from, to });
      }
    }
  }
  return moves;
}

export const isPromotionMove = (board: Board, from: Position, to: Position) => {
  const piece = board[from.row][from.col];
  return piece?.type === 'pawn' && (to.row === 0 || to.row === 7);
};

export function hasInsufficientMaterial(board: Board): boolean {
  const minors: { type: PieceType; square: number }[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece.type === 'king') continue;
      if (piece.type !== 'bishop' && piece.type !== 'knight') return false;
      minors.push({ type: piece.type, square: (row + col) % 2 });
    }
  }
  if (minors.length <= 1) return true;
  return minors.every(minor => minor.type === 'bishop' && minor.square === minors[0].square);
}

export interface PositionStatus {
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  drawReason: DrawReason | null;
}

export function getPositionStatus(position: GamePosition): PositionStatus {
  const isCheck = isInCheck(position.board, position.turn);
  const hasMoves = getAllLegalMoves(position).length > 0;
  const isCheckmate = isCheck && !hasMoves;
  const isStalemate = !isCheck && !hasMoves;
  let drawReason: DrawReason | null = null;
  if (isStalemate) drawReason = 'stalemate';
  else if (!isCheckmate && hasInsufficientMaterial(position.board)) drawReason = 'insufficient-material';
  else if (!isCheckmate && position.halfmoveClock >= 100) drawReason = 'fifty-moves';
  return { isCheck, isCheckmate, isStalemate, drawReason };
}

function sanDisambiguation(position: GamePosition, from: Position, to: Position, piece: Piece): string {
  if (piece.type === 'pawn' || piece.type === 'king') return '';
  const rivals: Position[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const other = position.board[row][col];
      if (!other || (row === from.row && col === from.col)) continue;
      if (other.type === piece.type && other.color === piece.color &&
          getLegalMoves(position, { row, col }).some(move => samePosition(move, to))) {
        rivals.push({ row, col });
      }
    }
  }
  if (rivals.length === 0) return '';
  const file = squareName(from)[0];
  const rank = squareName(from)[1];
  if (!rivals.some(r => r.col === from.col)) return file;
  if (!rivals.some(r => r.row === from.row)) return rank;
  return file + rank;
}

export function advancePosition(
  position: GamePosition,
  from: Position,
  to: Position,
  promotion: PromotionPiece = 'queen'
): GamePosition {
  const { board } = position;
  const piece = board[from.row][from.col];
  if (!piece) return position;
  const captured = board[to.row][to.col] ?? (piece.type === 'pawn' && from.col !== to.col);
  return {
    board: makeBoardMove(board, from, to, promotion),
    turn: opposite(piece.color),
    enPassant: piece.type === 'pawn' && Math.abs(to.row - from.row) === 2
      ? { row: (from.row + to.row) / 2, col: from.col }
      : null,
    halfmoveClock: piece.type === 'pawn' || captured ? 0 : position.halfmoveClock + 1,
    fullmoveNumber: position.fullmoveNumber + (piece.color === 'black' ? 1 : 0)
  };
}

export function applyMove(
  position: GamePosition,
  from: Position,
  to: Position,
  promotion: PromotionPiece = 'queen'
): { position: GamePosition; move: Move } {
  const { board } = position;
  const piece = board[from.row][from.col];
  if (!piece) throw new Error(`No piece on ${squareName(from)}`);

  const isEnPassant = piece.type === 'pawn' && from.col !== to.col && !board[to.row][to.col];
  const isCastling = piece.type === 'king' && Math.abs(to.col - from.col) === 2;
  const isPromotion = piece.type === 'pawn' && (to.row === 0 || to.row === 7);
  const captured = isEnPassant ? board[from.row][to.col] : board[to.row][to.col];
  const next = advancePosition(position, from, to, promotion);

  let san: string;
  if (isCastling) {
    san = to.col > from.col ? 'O-O' : 'O-O-O';
  } else {
    const prefix = piece.type === 'pawn'
      ? (captured ? squareName(from)[0] : '')
      : SAN_LETTERS[piece.type] + sanDisambiguation(position, from, to, piece);
    san = `${prefix}${captured ? 'x' : ''}${squareName(to)}${isPromotion ? `=${SAN_LETTERS[promotion]}` : ''}`;
  }
  const status = getPositionStatus(next);
  if (status.isCheckmate) san += '#';
  else if (status.isCheck) san += '+';

  return {
    position: next,
    move: {
      from,
      to,
      piece,
      capturedPiece: captured ?? undefined,
      isSpecialMove: isCastling ? 'castling' : isEnPassant ? 'enPassant' : isPromotion ? 'promotion' : undefined,
      promotion: isPromotion ? promotion : undefined,
      san
    }
  };
}

function castlingRights(board: Board): string {
  let rights = '';
  const checks: [PieceColor, number, string, string][] = [['white', 7, 'K', 'Q'], ['black', 0, 'k', 'q']];
  for (const [color, row, kingSide, queenSide] of checks) {
    const king = board[row][4];
    if (!king || king.type !== 'king' || king.color !== color || king.hasMoved) continue;
    const rookH = board[row][7];
    const rookA = board[row][0];
    if (rookH && rookH.type === 'rook' && rookH.color === color && !rookH.hasMoved) rights += kingSide;
    if (rookA && rookA.type === 'rook' && rookA.color === color && !rookA.hasMoved) rights += queenSide;
  }
  return rights || '-';
}

export function positionToFen(position: GamePosition): string {
  const rows = position.board.map(row => {
    let out = '';
    let empty = 0;
    for (const piece of row) {
      if (!piece) {
        empty++;
        continue;
      }
      if (empty) {
        out += empty;
        empty = 0;
      }
      const letter = FEN_LETTERS[piece.type];
      out += piece.color === 'white' ? letter.toUpperCase() : letter;
    }
    return empty ? out + empty : out;
  });
  const enPassant = position.enPassant ? squareName(position.enPassant) : '-';
  return `${rows.join('/')} ${position.turn === 'white' ? 'w' : 'b'} ${castlingRights(position.board)} ${enPassant} ${position.halfmoveClock} ${position.fullmoveNumber}`;
}

export function fenToPosition(fen: string): GamePosition {
  const [placement, turn = 'w', castling = '-', enPassant = '-', halfmove = '0', fullmove = '1'] = fen.trim().split(/\s+/);
  const board: Board = placement.split('/').map(rank => {
    const row: (Piece | null)[] = [];
    for (const char of rank) {
      if (/\d/.test(char)) {
        row.push(...Array(Number(char)).fill(null));
      } else {
        const color: PieceColor = char === char.toUpperCase() ? 'white' : 'black';
        row.push({ type: FEN_PIECES[char.toLowerCase()], color, hasMoved: true });
      }
    }
    return row;
  });

  const unlock = (row: number, col: number) => {
    const piece = board[row][col];
    if (piece) piece.hasMoved = false;
  };
  for (const [flag, row, rookCol] of [['K', 7, 7], ['Q', 7, 0], ['k', 0, 7], ['q', 0, 0]] as const) {
    if (castling.includes(flag)) {
      unlock(row, 4);
      unlock(row, rookCol);
    }
  }
  for (let col = 0; col < 8; col++) {
    const whitePawn = board[6][col];
    const blackPawn = board[1][col];
    if (whitePawn?.type === 'pawn' && whitePawn.color === 'white') whitePawn.hasMoved = false;
    if (blackPawn?.type === 'pawn' && blackPawn.color === 'black') blackPawn.hasMoved = false;
  }

  return {
    board,
    turn: turn === 'b' ? 'black' : 'white',
    enPassant: enPassant === '-' ? null : parseSquare(enPassant),
    halfmoveClock: Number(halfmove),
    fullmoveNumber: Number(fullmove)
  };
}

export function perft(position: GamePosition, depth: number): number {
  if (depth === 0) return 1;
  let nodes = 0;
  for (const { from, to } of getAllLegalMoves(position)) {
    if (isPromotionMove(position.board, from, to)) {
      for (const promotion of ['queen', 'rook', 'bishop', 'knight'] as PromotionPiece[]) {
        nodes += perft(advancePosition(position, from, to, promotion), depth - 1);
      }
    } else {
      nodes += perft(advancePosition(position, from, to), depth - 1);
    }
  }
  return nodes;
}
