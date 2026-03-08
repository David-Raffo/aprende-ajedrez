import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Play, SlidersHorizontal } from 'lucide-react';
import { PieceColor } from '@/types/chess';

interface GameControlsProps {
  onNewGame: () => void;
  onDifficultyChange: (difficulty: number) => void;
  onColorChange: (color: PieceColor) => void;
  difficulty: number;
  playerColor: PieceColor;
  gameInProgress: boolean;
}

export const GameControls = ({ 
  onNewGame, 
  onDifficultyChange, 
  onColorChange,
  difficulty, 
  playerColor,
  gameInProgress 
}: GameControlsProps) => {
  const difficultyNames = {
    1: 'Principiante',
    2: 'Fácil',
    3: 'Intermedio',
    4: 'Difícil',
    5: 'Experto'
  };

  return (
    <section className="w-full border border-border bg-card/70">
      <div className="space-y-5 p-5">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-primary">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <h2 className="text-xl">Partida</h2>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Tus piezas
          </label>
          <Select 
            value={playerColor} 
            onValueChange={(value: PieceColor) => onColorChange(value)}
          >
            <SelectTrigger className="h-11 bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="white">♔ Blancas</SelectItem>
              <SelectItem value="black">♚ Negras</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Nivel del rival
          </label>
          <Select 
            value={difficulty.toString()} 
            onValueChange={(value) => onDifficultyChange(parseInt(value))}
          >
            <SelectTrigger className="h-11 bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(difficultyNames).map(([level, name]) => (
                <SelectItem key={level} value={level}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={onNewGame}
          className="h-11 w-full gap-2 font-semibold"
          variant={gameInProgress ? "outline" : "default"}
        >
          {gameInProgress ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {gameInProgress ? 'Reiniciar partida' : 'Nueva partida'}
        </Button>
      </div>
    </section>
  );
};