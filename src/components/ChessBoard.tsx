import { useState, useCallback } from 'react';
import { Position, Board, Piece, PieceColor } from '@/types/chess';
import { PIECE_SYMBOLS } from '@/utils/chessLogic';
import { cn } from '@/lib/utils';

interface ChessBoardProps {
  board: Board;
  selectedSquare: Position | null;
  validMoves: Position[];
  onSquareClick: (position: Position) => void;
  isPlayerTurn: boolean;
  playerColor: PieceColor;
}

export const ChessBoard = ({ 
  board, 
  selectedSquare, 
  validMoves, 
  onSquareClick, 
  isPlayerTurn,
  playerColor 
}: ChessBoardProps) => {
  const [draggedPiece, setDraggedPiece] = useState<{ piece: Piece; from: Position } | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  const isLightSquare = (row: number, col: number) => (row + col) % 2 === 0;
  
  const isSelected = (row: number, col: number) => 
    selectedSquare?.row === row && selectedSquare?.col === col;
  
  const isValidMove = (row: number, col: number) =>
    validMoves.some(move => move.row === row && move.col === col);

  const handleMouseDown = useCallback((e: React.MouseEvent, position: Position) => {
    if (!isPlayerTurn) return;
    
    const piece = board[position.row][position.col];
    if (piece && piece.color === playerColor) {
      setDraggedPiece({ piece, from: position });
      setDragPosition({ x: e.clientX, y: e.clientY });
      onSquareClick(position);
    }
  }, [board, isPlayerTurn, onSquareClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggedPiece) {
      setDragPosition({ x: e.clientX, y: e.clientY });
    }
  }, [draggedPiece]);

  const handleMouseUp = useCallback((e: React.MouseEvent, position?: Position) => {
    if (draggedPiece && position) {
      onSquareClick(position);
    }
    setDraggedPiece(null);
    setDragPosition(null);
  }, [draggedPiece, onSquareClick]);

  // Touch handlers para dispositivos móviles - interacción simple con tap
  const handleTouchStart = useCallback((e: React.TouchEvent, position: Position) => {
    e.preventDefault();
    // Comportamiento simple: solo hacer click en la casilla
    onSquareClick(position);
  }, [onSquareClick]);

  const renderSquare = (row: number, col: number) => {
    const piece = board[row][col];
    const position = { row, col };
    const light = isLightSquare(row, col);
    const selected = isSelected(row, col);
    const validMove = isValidMove(row, col);
    const isDragging = draggedPiece?.from.row === row && draggedPiece?.from.col === col;

    return (
      <div
        key={`${row}-${col}`}
        className={cn(
          // Base styles - tamaño fijo para todos los cuadrados
          "relative flex min-h-0 min-w-0 items-center justify-center aspect-square touch-manipulation",
          "cursor-pointer transition-[filter] duration-150 select-none overflow-hidden",
          // Colores de fondo
          light ? "bg-chess-light-square" : "bg-chess-dark-square",
          // Estados especiales
          selected && "ring-4 ring-chess-highlight ring-inset z-10",
          !isPlayerTurn && piece?.color === playerColor && "cursor-not-allowed opacity-75",
          // Hover solo en casillas vacías o clickeables
          ((!piece && isPlayerTurn) || (piece?.color === playerColor && isPlayerTurn)) && "hover:brightness-110"
        )}
        onMouseDown={(e) => handleMouseDown(e, position)}
        onMouseUp={(e) => handleMouseUp(e, position)}
        onMouseMove={handleMouseMove}
        onTouchStart={(e) => handleTouchStart(e, position)}
      >
        {/* Indicador de movimiento válido */}
        {validMove && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center pointer-events-none",
            piece 
              ? "border-[5px] border-chess-highlight/80" 
              : ""
          )}>
            {!piece && (
              <div className="h-[22%] w-[22%] rounded-full bg-chess-highlight/80 shadow-highlight" />
            )}
          </div>
        )}

        {/* Pieza */}
        {piece && !isDragging && (
          <div className={cn(
            "chess-piece z-10 text-[clamp(2rem,9.5vw,4.75rem)] transition-transform duration-150",
            piece.color === 'white' ? "chess-piece-light" : "chess-piece-dark",
            selected && "scale-110",
          )}>
            {PIECE_SYMBOLS[piece.color][piece.type]}
          </div>
        )}
        
        {/* Coordenadas */}
        {col === 0 && (
          <div className={cn(
            "font-notation absolute left-1 top-0.5 text-[9px] font-semibold pointer-events-none sm:text-[10px]",
            light ? "text-chess-dark-square/70" : "text-chess-light-square/70"
          )}>
            {playerColor === 'white' ? 8 - row : row + 1}
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
      <div 
        className="grid aspect-square w-full grid-cols-8 grid-rows-8 overflow-hidden rounded-sm border-[6px] border-secondary shadow-board bg-gradient-board"
        onMouseMove={handleMouseMove}
        onMouseUp={() => handleMouseUp}
        onMouseLeave={() => {
          setDraggedPiece(null);
          setDragPosition(null);
        }}
      >
        {Array.from({ length: 8 }, (_, rowIndex) =>
          Array.from({ length: 8 }, (_, colIndex) => {
            // Invertir el tablero cuando el jugador juega con negras
            const row = playerColor === 'white' ? rowIndex : 7 - rowIndex;
            const col = colIndex;
            return renderSquare(row, col);
          })
        )}
      </div>

      {/* Pieza arrastrada */}
      {draggedPiece && dragPosition && (
        <div
          className="chess-piece fixed pointer-events-none z-50 text-6xl"
          style={{
            left: dragPosition.x - 32,
            top: dragPosition.y - 32,
            transform: 'scale(1.15)'
          }}
        >
          <span className={draggedPiece.piece.color === 'white' ? "chess-piece-light" : "chess-piece-dark"}>
            {PIECE_SYMBOLS[draggedPiece.piece.color][draggedPiece.piece.type]}
          </span>
        </div>
      )}
    </div>
  );
};