import { useState, useCallback, useEffect } from 'react';
import { GameState, Position, PieceColor, Board, Piece } from '@/types/chess';
import {
  createInitialBoard,
  isValidMove,
  makeMove,
  getPossibleMoves,
  isInCheck,
  isCheckmate,
  isStalemate,
  boardToFen,
  findKing
} from '@/utils/chessLogic';
import { getBestMove } from '@/utils/chessAI';
import { toast } from 'sonner';
import { playMoveSound, playCaptureSound, playCheckSound } from '@/utils/audioUtils';
import { MoveAnalysis } from '@/components/CoachPanel';

const COACH_WEBHOOK_URL = import.meta.env.VITE_COACH_WEBHOOK_URL as string | undefined;

export const isCoachEnabled = Boolean(COACH_WEBHOOK_URL);

const opposite = (color: PieceColor): PieceColor => (color === 'white' ? 'black' : 'white');

const squareName = (position: Position) => `${String.fromCharCode(97 + position.col)}${8 - position.row}`;

const createInitialState = (): GameState => ({
  board: createInitialBoard(),
  currentPlayer: 'white',
  isCheck: false,
  isCheckmate: false,
  isStalemate: false,
  gameOver: false,
  winner: null,
  moveHistory: [],
  selectedSquare: null,
  validMoves: []
});

const legalMovesFrom = (board: Board, position: Position) =>
  getPossibleMoves(board, position).filter(move => isValidMove(board, position, move));

export const useChessGame = () => {
  const [playerColor, setPlayerColor] = useState<PieceColor>('white');
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const [aiDifficulty, setAiDifficulty] = useState(3);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [lastMoveAnalysis, setLastMoveAnalysis] = useState<MoveAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const aiColor = opposite(playerColor);
  const isPlayerTurn = !gameState.gameOver && gameState.currentPlayer === playerColor && !isAiThinking;

  const analyzeMove = useCallback(async (
    from: Position,
    to: Position,
    capturedPiece: Piece | null,
    prevBoard: Board,
    newBoard: Board,
    movedPiece: Piece
  ) => {
    if (!COACH_WEBHOOK_URL) return;
    setIsAnalyzing(true);

    const fromSquare = squareName(from);
    const toSquare = squareName(to);
    const moveData = {
      from: fromSquare,
      to: toSquare,
      piece: movedPiece.type,
      pieceColor: movedPiece.color,
      move: `${movedPiece.color === 'white' ? 'blancas' : 'negras'} ${movedPiece.type} ${fromSquare}${capturedPiece ? 'x' : '-'}${toSquare}`,
      captured: capturedPiece !== null,
      capturedPiece: capturedPiece ? capturedPiece.type : null,
      playerColor,
      turn: opposite(movedPiece.color),
      fenBefore: boardToFen(prevBoard, movedPiece.color),
      fenAfter: boardToFen(newBoard, opposite(movedPiece.color)),
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(COACH_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moveData),
      });
      if (!response.ok) throw new Error(`Coach responded ${response.status}`);
      const analysis = await response.json();
      setLastMoveAnalysis({
        isGoodMove: analysis.isGoodMove ?? (analysis.rating === 'buena' || analysis.rating === 'excelente'),
        rating: analysis.rating || 'buena',
        improvement: analysis.improvement || analysis.suggestion || 'Buen movimiento, continúa así.',
        explanation: analysis.explanation || analysis.comment || 'Movimiento analizado correctamente.'
      });
    } catch (error) {
      console.error('Error analyzing move:', error);
      setLastMoveAnalysis({
        isGoodMove: true,
        rating: 'buena',
        improvement: 'Análisis no disponible en este momento.',
        explanation: 'No se pudo conectar con el entrenador.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [playerColor]);

  const applyMove = useCallback((from: Position, to: Position) => {
    const board = gameState.board;
    const piece = board[from.row][from.col];
    if (!piece) return;
    const captured = board[to.row][to.col];
    const newBoard = makeMove(board, from, to);
    const nextPlayer = opposite(piece.color);
    const check = isInCheck(newBoard, nextPlayer);
    const checkmate = isCheckmate(newBoard, nextPlayer);
    const stalemate = isStalemate(newBoard, nextPlayer);

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: nextPlayer,
      isCheck: check,
      isCheckmate: checkmate,
      isStalemate: stalemate,
      gameOver: checkmate || stalemate,
      winner: checkmate ? piece.color : null,
      moveHistory: [...prev.moveHistory, { from, to, piece, capturedPiece: captured || undefined }],
      selectedSquare: null,
      validMoves: []
    }));

    if (checkmate) {
      toast.success(piece.color === playerColor ? '¡Jaque mate! Has ganado' : 'Jaque mate. La IA gana');
    } else if (stalemate) {
      toast.info('Tablas por ahogado');
    } else if (check) {
      playCheckSound();
    } else if (captured) {
      playCaptureSound();
    } else {
      playMoveSound();
    }

    if (piece.color === playerColor) {
      analyzeMove(from, to, captured, board, newBoard, piece);
    }
  }, [gameState.board, playerColor, analyzeMove]);

  const selectSquare = useCallback((position: Position) => {
    setGameState(prev => ({
      ...prev,
      selectedSquare: position,
      validMoves: legalMovesFrom(prev.board, position)
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setGameState(prev => ({ ...prev, selectedSquare: null, validMoves: [] }));
  }, []);

  const tryMove = useCallback((from: Position, to: Position) => {
    if (!isPlayerTurn) return;
    const piece = gameState.board[from.row][from.col];
    if (!piece || piece.color !== playerColor) return;
    if (isValidMove(gameState.board, from, to)) {
      applyMove(from, to);
    } else {
      toast.error('Movimiento no válido');
      clearSelection();
    }
  }, [isPlayerTurn, gameState.board, playerColor, applyMove, clearSelection]);

  const handleSquareClick = useCallback((position: Position) => {
    if (!isPlayerTurn) return;
    const { selectedSquare, board } = gameState;
    const clickedPiece = board[position.row][position.col];

    if (clickedPiece && clickedPiece.color === playerColor) {
      if (selectedSquare && selectedSquare.row === position.row && selectedSquare.col === position.col) {
        clearSelection();
      } else {
        selectSquare(position);
      }
      return;
    }

    if (selectedSquare) tryMove(selectedSquare, position);
  }, [isPlayerTurn, gameState, playerColor, selectSquare, clearSelection, tryMove]);

  useEffect(() => {
    if (gameState.gameOver || gameState.currentPlayer !== aiColor) return;
    let cancelled = false;
    setIsAiThinking(true);
    const timer = setTimeout(() => {
      if (cancelled) return;
      const bestMove = getBestMove(gameState.board, aiColor, aiDifficulty);
      if (!cancelled && bestMove) applyMove(bestMove.from, bestMove.to);
      setIsAiThinking(false);
    }, 400 + Math.random() * 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      setIsAiThinking(false);
    };
  }, [gameState.board, gameState.currentPlayer, gameState.gameOver, aiColor, aiDifficulty, applyMove]);

  const startNewGame = useCallback((color: PieceColor = playerColor) => {
    setPlayerColor(color);
    setGameState(createInitialState());
    setLastMoveAnalysis(null);
    setIsAnalyzing(false);
  }, [playerColor]);

  const changePlayerColor = useCallback((color: PieceColor) => {
    startNewGame(color);
  }, [startNewGame]);

  const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1] ?? null;
  const checkSquare = gameState.isCheck ? findKing(gameState.board, gameState.currentPlayer) : null;

  return {
    gameState,
    isPlayerTurn,
    aiDifficulty,
    isAiThinking,
    playerColor,
    lastMove,
    checkSquare,
    handleSquareClick,
    tryMove,
    startNewGame: () => startNewGame(),
    setAiDifficulty,
    changePlayerColor,
    lastMoveAnalysis,
    isAnalyzing
  };
};
