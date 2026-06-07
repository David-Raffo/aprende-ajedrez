import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { Move } from '@/types/chess';

interface MoveHistoryProps {
  moves: Move[];
}

export const MoveHistory = ({ moves }: MoveHistoryProps) => {
  const listRef = useRef<HTMLOListElement>(null);
  const pairs = Array.from({ length: Math.ceil(moves.length / 2) }, (_, index) => ({
    number: index + 1,
    white: moves[index * 2],
    black: moves[index * 2 + 1]
  }));

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [moves.length]);

  return (
    <section className="border border-border bg-card/70">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-xl">Movimientos</h2>
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <div className="min-h-40 p-5">
        {pairs.length > 0 ? (
          <ol ref={listRef} className="font-notation max-h-56 space-y-0.5 overflow-y-auto pr-1 text-xs">
            {pairs.map(({ number, white, black }) => (
              <li key={number} className="grid grid-cols-[2.5rem_1fr_1fr] border-b border-border/60 py-1.5 last:border-0">
                <span className="text-muted-foreground">{number}.</span>
                <span>{white?.san}</span>
                <span>{black?.san ?? ''}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="flex min-h-28 items-center justify-center text-center text-sm text-muted-foreground">
            La notación aparecerá al comenzar la partida.
          </p>
        )}
      </div>
    </section>
  );
};
