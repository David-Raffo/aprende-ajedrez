import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { GameState, Move, Position, PieceColor, PromotionPiece } from '@/types/chess';
import {
  applyMove as applyChessMove,
  createInitialPosition,
  findKing,
  getLegalMoves,
  getPositionStatus,
  isLegalMove,
  isPromotionMove,
  opposite,
  positionToFen,
  samePosition,
  squareName
} from '@/utils/chessLogic';
import { createAiClient } from '@/utils/aiClient';
import { playMoveSound, playCaptureSound, playCheckSound } from '@/utils/audioUtils';
import { MoveAnalysis } from '@/components/CoachPanel';

const COACH_WEBHOOK_URL = import.meta.env.VITE_COACH_WEBHOOK_URL as string | undefined;

export const isCoachEnabled = Boolean(COACH_WEBHOOK_URL);

const DRAW_MESSAGES = {
  'stalemate': 'Tablas por ahogado',
  'insufficient-material': 'Tablas por material insuficiente',
  'fifty-moves': 'Tablas por la regla de los 50 movimientos'
} as const;

const AI_MIN_DELAY_MS = 450;

const createInitialState = (): GameState => ({
  position: createInitialPosition(),
  isCheck: false,
  isCheckmate: false,
  isStalemate: false,
  drawReason: null,
  gameOver: false,
  winner: null,
  moveHistory: [],
  selectedSquare: null,
  validMoves: []
});

export const useChessGame = () => {
  const [playerColor, setPlayerColor] = useState<PieceColor>('white');
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const [aiDifficulty, setAiDifficulty] = useState(3);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Position; to: Position } | null>(null);
  const [lastMoveAnalysis, setLastMoveAnalysis] = useState<MoveAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const aiClientRef = useRef<ReturnType<typeof createAiClient> | null>(null);

  const { position } = gameState;
  const aiColor = opposite(playerColor);
  const isPlayerTurn = !gameState.gameOver && position.turn === playerColor && !isAiThinking && !pendingPromotion;

  const analyzeMove = useCallback(async (move: Move, fenBefore: string, fenAfter: string) => {
    if (!COACH_WEBHOOK_URL) return;
    setIsAnalyzing(true);
    const fromSquare = squareName(move.from);
    const toSquare = squareName(move.to);

    try {
      const response = await fetch(COACH_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromSquare,
          to: toSquare,
          san: move.san,
          piece: move.piece.type,
          pieceColor: move.piece.color,
          move: `${move.piece.color === 'white' ? 'blancas' : 'negras'} ${move.san}`,
          captured: Boolean(move.capturedPiece),
          capturedPiece: move.capturedPiece?.type ?? null,
          promotion: move.promotion ?? null,
          playerColor,
          turn: opposite(move.piece.color),
          fenBefore,
          fenAfter,
          timestamp: new Date().toISOString()
        }),
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

  const commitMove = useCallback((from: Position, to: Position, promotion: PromotionPiece = 'queen') => {
    const { position: next, move } = applyChessMove(position, from, to, promotion);
    const status = getPositionStatus(next);
    const gameOver = status.isCheckmate || status.drawReason !== null;

    setGameState(prev => ({
      ...prev,
      position: next,
      ...status,
      gameOver,
      winner: status.isCheckmate ? move.piece.color : null,
      moveHistory: [...prev.moveHistory, move],
      selectedSquare: null,
      validMoves: []
    }));

    if (status.isCheckmate) {
      toast.success(move.piece.color === playerColor ? '¡Jaque mate! Has ganado' : 'Jaque mate. La IA gana');
    } else if (status.drawReason) {
      toast.info(DRAW_MESSAGES[status.drawReason]);
    }
    if (status.isCheck) playCheckSound();
    else if (move.capturedPiece) playCaptureSound();
    else playMoveSound();

    if (move.piece.color === playerColor) {
      analyzeMove(move, positionToFen(position), positionToFen(next));
    }
  }, [position, playerColor, analyzeMove]);

  const clearSelection = useCallback(() => {
    setGameState(prev => ({ ...prev, selectedSquare: null, validMoves: [] }));
  }, []);

  const tryMove = useCallback((from: Position, to: Position) => {
    if (!isPlayerTurn) return;
    if (!isLegalMove(position, from, to)) {
      toast.error('Movimiento no válido');
      clearSelection();
      return;
    }
    if (isPromotionMove(position.board, from, to)) {
      setPendingPromotion({ from, to });
      return;
    }
    commitMove(from, to);
  }, [isPlayerTurn, position, commitMove, clearSelection]);

  const choosePromotion = useCallback((piece: PromotionPiece | null) => {
    if (pendingPromotion && piece) commitMove(pendingPromotion.from, pendingPromotion.to, piece);
    else clearSelection();
    setPendingPromotion(null);
  }, [pendingPromotion, commitMove, clearSelection]);

  const handleSquareClick = useCallback((square: Position) => {
    if (!isPlayerTurn) return;
    const clickedPiece = position.board[square.row][square.col];

    if (clickedPiece && clickedPiece.color === playerColor) {
      if (samePosition(gameState.selectedSquare, square)) {
        clearSelection();
      } else {
        setGameState(prev => ({ ...prev, selectedSquare: square, validMoves: getLegalMoves(prev.position, square) }));
      }
      return;
    }

    if (gameState.selectedSquare) tryMove(gameState.selectedSquare, square);
  }, [isPlayerTurn, position, playerColor, gameState.selectedSquare, clearSelection, tryMove]);

  useEffect(() => () => aiClientRef.current?.dispose(), []);

  useEffect(() => {
    if (gameState.gameOver || position.turn !== aiColor) return;
    aiClientRef.current ??= createAiClient();
    let cancelled = false;
    setIsAiThinking(true);
    const request = aiClientRef.current.request(position, aiDifficulty);
    const minDelay = new Promise(resolve => setTimeout(resolve, AI_MIN_DELAY_MS));
    Promise.all([request.promise, minDelay]).then(([move]) => {
      if (cancelled) return;
      setIsAiThinking(false);
      if (move) commitMove(move.from, move.to);
    });
    return () => {
      cancelled = true;
      request.cancel();
      setIsAiThinking(false);
    };
  }, [position, gameState.gameOver, aiColor, aiDifficulty, commitMove]);

  const startNewGame = useCallback((color: PieceColor = playerColor) => {
    setPlayerColor(color);
    setGameState(createInitialState());
    setPendingPromotion(null);
    setLastMoveAnalysis(null);
    setIsAnalyzing(false);
  }, [playerColor]);

  const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1] ?? null;
  const checkSquare = gameState.isCheck ? findKing(position.board, position.turn) : null;

  return {
    gameState,
    isPlayerTurn,
    aiDifficulty,
    isAiThinking,
    playerColor,
    lastMove,
    checkSquare,
    pendingPromotion,
    handleSquareClick,
    tryMove,
    choosePromotion,
    startNewGame: () => startNewGame(),
    setAiDifficulty,
    changePlayerColor: (color: PieceColor) => startNewGame(color),
    lastMoveAnalysis,
    isAnalyzing
  };
};
