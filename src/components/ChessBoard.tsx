import { useState } from 'react';
import type React from 'react';
import { Position, Board, PieceColor } from '@/types/chess';
import { PIECE_SYMBOLS } from '@/utils/chessLogic';
import { cn } from '@/lib/utils';

interface ChessBoardProps {
  board: Board;
  selectedSquare: Position | null;
  validMoves: Position[];
  lastMove?: { from: Position; to: Position } | null;
  checkSquare?: Position | null;
  onSquareClick: (position: Position) => void;
  onMove: (from: Position, to: Position) => void;
  isPlayerTurn: boolean;
  playerColor: PieceColor;
}

const samePosition = (a: Position | null | undefined, b: Position) => !!a && a.row === b.row && a.col === b.col;

const squareName = (row: number, col: number) => `${String.fromCharCode(97 + col)}${8 - row}`;

export const ChessBoard = ({
  board,
  selectedSquare,
  validMoves,
  lastMove,
  checkSquare,
  onSquareClick,
  onMove,
  isPlayerTurn,
  playerColor
}: ChessBoardProps) => {
  const [dragFrom, setDragFrom] = useState<Position | null>(null);

  const isValidTarget = (row: number, col: number) =>
    validMoves.some(move => move.row === row && move.col === col);

  const handleDragStart = (event: React.DragEvent, position: Position) => {
    const piece = board[position.row][position.col];
    if (!isPlayerTurn || !piece || piece.color !== playerColor) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    setDragFrom(position);
    if (!samePosition(selectedSquare, position)) onSquareClick(position);
  };

  const handleDrop = (event: React.DragEvent, position: Position) => {
    event.preventDefault();
    if (dragFrom && !samePosition(dragFrom, position)) onMove(dragFrom, position);
    setDragFrom(null);
  };

  const renderSquare = (row: number, col: number) => {
    const piece = board[row][col];
    const position = { row, col };
    const light = (row + col) % 2 === 0;
    const selected = samePosition(selectedSquare, position);
    const validTarget = isValidTarget(row, col);
    const inLastMove = samePosition(lastMove?.from, position) || samePosition(lastMove?.to, position);
    const inCheck = samePosition(checkSquare, position);
    const ownPiece = piece?.color === playerColor;

    return (
      <div
        key={`${row}-${col}`}
        role="button"
        tabIndex={isPlayerTurn ? 0 : -1}
        aria-label={`${squareName(row, col)}${piece ? `, ${piece.color === 'white' ? 'blanca' : 'negra'} ${piece.type}` : ''}`}
        className={cn(
          "relative flex min-h-0 min-w-0 items-center justify-center aspect-square touch-manipulation",
          "cursor-pointer transition-[filter] duration-150 select-none overflow-hidden",
          light ? "bg-chess-light-square" : "bg-chess-dark-square",
          inLastMove && "after:absolute after:inset-0 after:bg-chess-highlight/25 after:pointer-events-none",
          inCheck && "bg-chess-danger/80",
          selected && "ring-4 ring-chess-highlight ring-inset z-10",
          !isPlayerTurn && ownPiece && "cursor-not-allowed opacity-75",
          isPlayerTurn && (!piece || ownPiece || validTarget) && "hover:brightness-110"
        )}
        onClick={() => onSquareClick(position)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSquareClick(position);
          }
        }}
        onDragOver={(event) => {
          if (dragFrom) event.preventDefault();
        }}
        onDrop={(event) => handleDrop(event, position)}
      >
        {validTarget && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center pointer-events-none",
            piece && "border-[5px] border-chess-highlight/80"
          )}>
            {!piece && <div className="h-[22%] w-[22%] rounded-full bg-chess-highlight/80 shadow-highlight" />}
          </div>
        )}

        {piece && (
          <div
            draggable={isPlayerTurn && ownPiece}
            onDragStart={(event) => handleDragStart(event, position)}
            onDragEnd={() => setDragFrom(null)}
            className={cn(
              "chess-piece z-10 text-[clamp(2rem,9.5vw,4.75rem)] transition-transform duration-150",
              piece.color === 'white' ? "chess-piece-light" : "chess-piece-dark",
              selected && "scale-110",
              samePosition(dragFrom, position) && "opacity-40"
            )}
          >
            {PIECE_SYMBOLS[piece.color][piece.type]}
          </div>
        )}

        {col === (playerColor === 'white' ? 0 : 7) && (
          <div className={cn(
            "font-notation absolute left-1 top-0.5 text-[9px] font-semibold pointer-events-none sm:text-[10px]",
            light ? "text-chess-dark-square/70" : "text-chess-light-square/70"
          )}>
            {8 - row}
          </div>
        )}
        {row === (playerColor === 'white' ? 7 : 0) && (
          <div className={cn(
            "font-notation absolute right-1 bottom-0.5 text-[9px] font-semibold pointer-events-none sm:text-[10px]",
            light ? "text-chess-dark-square/70" : "text-chess-light-square/70"
          )}>
            {String.fromCharCode(97 + col)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-[min(76vh,680px)]">
      <div className="grid aspect-square w-full grid-cols-8 grid-rows-8 overflow-hidden rounded-sm border-[6px] border-secondary shadow-board bg-gradient-board">
        {Array.from({ length: 8 }, (_, rowIndex) =>
          Array.from({ length: 8 }, (_, colIndex) => {
            const row = playerColor === 'white' ? rowIndex : 7 - rowIndex;
            const col = playerColor === 'white' ? colIndex : 7 - colIndex;
            return renderSquare(row, col);
          })
        )}
      </div>
    </div>
  );
};
