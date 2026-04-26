import { PieceColor, PromotionPiece } from '@/types/chess';
import { PIECE_SYMBOLS } from '@/utils/chessLogic';
import { cn } from '@/lib/utils';

interface PromotionDialogProps {
  color: PieceColor;
  onSelect: (piece: PromotionPiece | null) => void;
}

const OPTIONS: { piece: PromotionPiece; label: string }[] = [
  { piece: 'queen', label: 'Dama' },
  { piece: 'rook', label: 'Torre' },
  { piece: 'bishop', label: 'Alfil' },
  { piece: 'knight', label: 'Caballo' }
];

export const PromotionDialog = ({ color, onSelect }: PromotionDialogProps) => (
  <div
    className="absolute inset-0 z-30 flex items-center justify-center bg-background/70 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-label="Elige la pieza de coronación"
    onClick={() => onSelect(null)}
  >
    <div className="border border-primary/40 bg-card p-5 shadow-board" onClick={(event) => event.stopPropagation()}>
      <p className="mb-4 text-center text-lg">Corona tu peón</p>
      <div className="grid grid-cols-4 gap-2">
        {OPTIONS.map(({ piece, label }) => (
          <button
            key={piece}
            type="button"
            autoFocus={piece === 'queen'}
            onClick={() => onSelect(piece)}
            className="flex flex-col items-center gap-1 rounded-sm border border-border bg-secondary/40 px-3 py-2 transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className={cn('chess-piece text-5xl', color === 'white' ? 'chess-piece-light' : 'chess-piece-dark')}>
              {PIECE_SYMBOLS[color][piece]}
            </span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);
