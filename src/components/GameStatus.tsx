import { GameState, PieceColor } from '@/types/chess';
import { Badge } from '@/components/ui/badge';
import { Crown, AlertTriangle, CircleDot } from 'lucide-react';

interface GameStatusProps {
  gameState: GameState;
  isPlayerTurn: boolean;
  isAiThinking: boolean;
  playerColor: PieceColor;
}

export const GameStatus = ({ gameState, isPlayerTurn, isAiThinking, playerColor }: GameStatusProps) => {
  const playerWon = gameState.winner === playerColor;

  const getStatusMessage = () => {
    if (gameState.isCheckmate) {
      return playerWon ? '¡Jaque mate! Has ganado' : 'Jaque mate. La IA gana';
    }
    if (gameState.isStalemate) {
      return '¡Tablas por ahogado!';
    }
    if (gameState.isCheck) {
      return gameState.currentPlayer === playerColor ? '¡Jaque! Tu rey está en peligro' : '¡Jaque al rey rival!';
    }
    if (isPlayerTurn) {
      return 'Tu turno';
    }
    return isAiThinking ? 'La IA está pensando…' : 'Turno de la IA';
  };

  const getStatusIcon = () => {
    if (gameState.isCheckmate) {
      return <Crown className="w-5 h-5" />;
    }
    if (gameState.isCheck) {
      return <AlertTriangle className="w-5 h-5" />;
    }
    return <CircleDot className="w-4 h-4" />;
  };

  const getStatusVariant = () => {
    if (gameState.isCheckmate) {
      return playerWon ? 'default' : 'destructive';
    }
    if (gameState.isCheck) {
      return 'destructive';
    }
    if (gameState.isStalemate) {
      return 'secondary';
    }
    return isPlayerTurn ? 'default' : 'secondary';
  };

  return (
    <section className="w-full border border-border bg-card/70">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Estado</h2>
          <Badge variant={getStatusVariant()} className="flex items-center gap-1.5 rounded-sm">
            {getStatusIcon()}
            {gameState.currentPlayer === 'white' ? 'Blancas' : 'Negras'}
          </Badge>
        </div>
        
        <div className="border-y border-border bg-secondary/35 py-4 text-center">
          <p className="font-medium text-foreground">
            {getStatusMessage()}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 divide-x divide-border text-sm">
          <div className="text-center">
            <p className="text-xs uppercase text-muted-foreground">Jugadas</p>
            <p className="font-notation mt-1 text-lg font-semibold">{gameState.moveHistory.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase text-muted-foreground">Situación</p>
            <p className="mt-1 text-sm font-semibold">
              {gameState.gameOver ? 'Terminado' : 'En juego'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};