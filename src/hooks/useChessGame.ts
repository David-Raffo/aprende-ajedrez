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
  boardToFen
} from '@/utils/chessLogic';
import { getBestMove } from '@/utils/chessAI';
import { toast } from 'sonner';
import { playMoveSound, playCaptureSound, playCheckSound } from '@/utils/audioUtils';
import { MoveAnalysis } from '@/components/CoachPanel';

export const useChessGame = () => {
  const [playerColor, setPlayerColor] = useState<PieceColor>('white');
  const [gameState, setGameState] = useState<GameState>({
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

  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [aiDifficulty, setAiDifficulty] = useState(3);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [lastMoveAnalysis, setLastMoveAnalysis] = useState<MoveAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const updateGameState = useCallback((newBoard = gameState.board, currentPlayer = gameState.currentPlayer) => {
    const isCheck = isInCheck(newBoard, currentPlayer);
    const isCheckmateCond = isCheckmate(newBoard, currentPlayer);
    const isStalemateCond = isStalemate(newBoard, currentPlayer);
    const gameOver = isCheckmateCond || isStalemateCond;
    
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer,
      isCheck,
      isCheckmate: isCheckmateCond,
      isStalemate: isStalemateCond,
      gameOver,
      winner: isCheckmateCond ? (currentPlayer === 'white' ? 'black' : 'white') : null,
      selectedSquare: null,
      validMoves: []
    }));

    if (isCheckmateCond) {
      const playerWon = (currentPlayer === 'white' && playerColor === 'black') || 
                       (currentPlayer === 'black' && playerColor === 'white');
      toast.success(playerWon ? '¡Has ganado!' : '¡La IA gana!');
    } else if (isStalemateCond) {
      toast.info('¡Empate por ahogado!');
    } else if (isCheck) {
      playCheckSound();
      toast.warning('¡Jaque!');
    }
  }, [gameState.board, gameState.currentPlayer, playerColor]);

  const analyzeMove = useCallback(async (
    from: Position,
    to: Position,
    capturedPiece: Piece | null,
    prevBoard: Board,
    newBoard: Board,
    movedPiece: Piece,
    moverColor: PieceColor,
    nextPlayer: PieceColor
  ) => {
    const webhookUrl = import.meta.env.VITE_COACH_WEBHOOK_URL;

    setIsAnalyzing(true);

    try {
      // FEN antes de la jugada (tablero justo antes, turno de quien mueve)
      const fenBefore = boardToFen(prevBoard, moverColor);
      // FEN después de la jugada (tablero nuevo, turno del rival)
      const fenAfter = boardToFen(newBoard, nextPlayer);

      const fromSquare = `${String.fromCharCode(97 + from.col)}${8 - from.row}`;
      const toSquare = `${String.fromCharCode(97 + to.col)}${8 - to.row}`;

      const moveData = {
        from: fromSquare,
        to: toSquare,
        piece: movedPiece.type,
        pieceColor: movedPiece.color,
        move: `${movedPiece.color === 'white' ? 'blancas' : 'negras'} ${movedPiece.type} ${fromSquare}${capturedPiece ? 'x' : '-'}${toSquare}`,
        captured: capturedPiece !== null,
        capturedPiece: capturedPiece ? capturedPiece.type : null,
        playerColor,
        turn: nextPlayer,
        fenBefore,
        fenAfter,
        timestamp: new Date().toISOString()
      };


      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moveData),
      });

      if (response.ok) {
        const analysis = await response.json();

        const moveAnalysis: MoveAnalysis = {
          isGoodMove: analysis.isGoodMove || analysis.rating === 'buena' || analysis.rating === 'excelente',
          rating: analysis.rating || 'buena',
          improvement: analysis.improvement || analysis.suggestion || 'Buen movimiento, continúa así.',
          explanation: analysis.explanation || analysis.comment || 'Movimiento analizado correctamente.'
        };

        setLastMoveAnalysis(moveAnalysis);
      } else {
        setLastMoveAnalysis({
          isGoodMove: true,
          rating: 'buena',
          improvement: 'Análisis no disponible en este momento.',
          explanation: 'No se pudo conectar con el entrenador.'
        });
      }
    } catch (error) {
      console.error('Error analyzing move:', error);
      setLastMoveAnalysis({
        isGoodMove: true,
        rating: 'buena',
        improvement: 'Error de conexión con el entrenador.',
        explanation: 'No se pudo analizar la jugada.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [playerColor]);

  const handleSquareClick = useCallback((position: Position) => {
    if (gameState.gameOver || !isPlayerTurn) return;

    const { selectedSquare, board, currentPlayer } = gameState;
    const clickedPiece = board[position.row][position.col];

    // If no square is selected
    if (!selectedSquare) {
      if (clickedPiece && clickedPiece.color === playerColor) {
        const validMoves = getPossibleMoves(board, position).filter(move => 
          isValidMove(board, position, move)
        );
        
        setGameState(prev => ({
          ...prev,
          selectedSquare: position,
          validMoves
        }));
      }
      return;
    }

    // If same square is clicked again, deselect
    if (selectedSquare.row === position.row && selectedSquare.col === position.col) {
      setGameState(prev => ({
        ...prev,
        selectedSquare: null,
        validMoves: []
      }));
      return;
    }

    // If trying to select another piece of the same color
    if (clickedPiece && clickedPiece.color === playerColor) {
      const validMoves = getPossibleMoves(board, position).filter(move => 
        isValidMove(board, position, move)
      );
      
      setGameState(prev => ({
        ...prev,
        selectedSquare: position,
        validMoves
      }));
      return;
    }

    // Try to make a move
    if (isValidMove(board, selectedSquare, position)) {
      const newBoard = makeMove(board, selectedSquare, position);
      const nextPlayer: PieceColor = currentPlayer === 'white' ? 'black' : 'white';
      
      // Play sound effect
      if (clickedPiece) {
        playCaptureSound();
      } else {
        playMoveSound();
      }
      
      setGameState(prev => ({
        ...prev,
        moveHistory: [...prev.moveHistory, {
          from: selectedSquare,
          to: position,
          piece: board[selectedSquare.row][selectedSquare.col]!,
          capturedPiece: clickedPiece || undefined
        }]
      }));

      updateGameState(newBoard, nextPlayer);
      setIsPlayerTurn(nextPlayer === playerColor);
      
      // Analizar solo movimientos del jugador
      if (currentPlayer === playerColor) {
        analyzeMove(
          selectedSquare,
          position,
          clickedPiece,
          board,
          newBoard,
          board[selectedSquare.row][selectedSquare.col]!,
          currentPlayer,
          nextPlayer
        );
      }
      
      toast.success('¡Buen movimiento!');
    } else {
      toast.error('Movimiento inválido');
      setGameState(prev => ({
        ...prev,
        selectedSquare: null,
        validMoves: []
      }));
    }
  }, [gameState, isPlayerTurn, updateGameState, playerColor]);

  const makeAiMove = useCallback(async () => {
    const aiColor = playerColor === 'white' ? 'black' : 'white';
    if (gameState.gameOver || gameState.currentPlayer !== aiColor) return;

    setIsAiThinking(true);
    
    // Add a small delay to make it feel more natural
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const bestMove = getBestMove(gameState.board, aiColor, aiDifficulty);
    
    if (bestMove) {
      const newBoard = makeMove(gameState.board, bestMove.from, bestMove.to);
      const capturedPiece = gameState.board[bestMove.to.row][bestMove.to.col];
      
      // Play sound effect for AI move
      if (capturedPiece) {
        playCaptureSound();
      } else {
        playMoveSound();
      }
      
      setGameState(prev => ({
        ...prev,
        moveHistory: [...prev.moveHistory, {
          from: bestMove.from,
          to: bestMove.to,
          piece: gameState.board[bestMove.from.row][bestMove.from.col]!,
          capturedPiece: capturedPiece || undefined
        }]
      }));

      const nextPlayer: PieceColor = aiColor === 'white' ? 'black' : 'white';
      updateGameState(newBoard, nextPlayer);
      setIsPlayerTurn(nextPlayer === playerColor);
      
      if (capturedPiece) {
        toast.info('La IA capturó una pieza');
      }
    }
    
    setIsAiThinking(false);
  }, [gameState, aiDifficulty, updateGameState, playerColor]);

  // Effect to trigger AI moves
  useEffect(() => {
    const aiColor = playerColor === 'white' ? 'black' : 'white';
    if (!isPlayerTurn && !gameState.gameOver && gameState.currentPlayer === aiColor) {
      makeAiMove();
    }
  }, [isPlayerTurn, gameState.gameOver, gameState.currentPlayer, makeAiMove, playerColor]);

  const startNewGame = useCallback(() => {
    setGameState({
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
    setIsPlayerTurn(playerColor === 'white');
    setIsAiThinking(false);
    setLastMoveAnalysis(null);
    setIsAnalyzing(false);
    toast.info('¡Nueva partida iniciada!');
  }, [playerColor]);

  const changePlayerColor = useCallback((color: PieceColor) => {
    setPlayerColor(color);
    startNewGame();
  }, [startNewGame]);

  return {
    gameState,
    isPlayerTurn: isPlayerTurn && !isAiThinking,
    aiDifficulty,
    isAiThinking,
    playerColor,
    handleSquareClick,
    startNewGame,
    setAiDifficulty,
    changePlayerColor,
    lastMoveAnalysis,
    isAnalyzing
  };
};