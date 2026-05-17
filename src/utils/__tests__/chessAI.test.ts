import { describe, expect, it } from 'vitest';
import { fenToPosition, squareName } from '../chessLogic';
import { getBestMove } from '../chessAI';

const best = (fen: string, difficulty = 3) => {
  const move = getBestMove(fenToPosition(fen), difficulty, () => 0);
  return move ? `${squareName(move.from)}${squareName(move.to)}` : null;
};

describe('chess AI', () => {
  it('finds a back-rank mate in one', () => {
    expect(best('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1')).toBe('a1a8');
  });

  it('captures an undefended queen', () => {
    expect(best('4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1')).toBe('d1d5');
  });

  it('does not grab a defended pawn with the queen', () => {
    expect(best('4k3/8/2p5/3p4/8/8/3Q4/4K3 w - - 0 1', 4)).not.toBe('d2d5');
  });

  it('returns null when there are no legal moves', () => {
    expect(best('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')).toBeNull();
  });
});
