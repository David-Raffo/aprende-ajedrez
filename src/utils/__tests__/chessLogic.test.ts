import { describe, expect, it } from 'vitest';
import {
  applyMove,
  createInitialPosition,
  fenToPosition,
  getAllLegalMoves,
  getPositionStatus,
  hasInsufficientMaterial,
  INITIAL_FEN,
  parseSquare,
  perft,
  positionToFen
} from '../chessLogic';

const play = (fen: string, ...moves: string[]) =>
  moves.reduce(
    ({ position, sans }, move) => {
      const result = applyMove(position, parseSquare(move.slice(0, 2)), parseSquare(move.slice(2, 4)));
      return { position: result.position, sans: [...sans, result.move.san] };
    },
    { position: fenToPosition(fen), sans: [] as string[] }
  );

describe('move generation (perft)', () => {
  it('matches the reference counts from the initial position', () => {
    const position = createInitialPosition();
    expect(perft(position, 1)).toBe(20);
    expect(perft(position, 2)).toBe(400);
    expect(perft(position, 3)).toBe(8902);
  });

  it('handles castling, en passant and promotions in "Kiwipete"', () => {
    const position = fenToPosition('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
    expect(perft(position, 1)).toBe(48);
    expect(perft(position, 2)).toBe(2039);
  });

  it('handles discovered checks and en passant pins', () => {
    const position = fenToPosition('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1');
    expect(perft(position, 1)).toBe(14);
    expect(perft(position, 2)).toBe(191);
    expect(perft(position, 3)).toBe(2812);
  });

  it('handles promotions with checks', () => {
    const position = fenToPosition('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1');
    expect(perft(position, 1)).toBe(6);
    expect(perft(position, 2)).toBe(264);
  });
});

describe('FEN', () => {
  it('round-trips the initial position', () => {
    expect(positionToFen(fenToPosition(INITIAL_FEN))).toBe(INITIAL_FEN);
    expect(positionToFen(createInitialPosition())).toBe(INITIAL_FEN);
  });

  it('tracks en passant, castling rights and move counters', () => {
    const { position } = play(INITIAL_FEN, 'e2e4', 'g8f6', 'e1e2');
    expect(positionToFen(position)).toBe('rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPPKPPP/RNBQ1BNR b kq - 2 2');
    expect(positionToFen(play(INITIAL_FEN, 'e2e4').position)).toBe(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
    );
  });
});

describe('special moves and SAN', () => {
  it('castles on both sides', () => {
    const { position, sans } = play('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'e1g1', 'e8c8');
    expect(sans).toEqual(['O-O', 'O-O-O']);
    expect(positionToFen(position)).toBe('2kr3r/8/8/8/8/8/8/R4RK1 w - - 2 2');
  });

  it('captures en passant', () => {
    const { position, sans } = play('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', 'e5d6');
    expect(sans).toEqual(['exd6']);
    expect(position.board[3][3]).toBeNull();
  });

  it('promotes and disambiguates', () => {
    expect(play('7k/P7/8/8/8/8/8/K7 w - - 0 1', 'a7a8').sans).toEqual(['a8=Q+']);
    expect(play('k7/8/8/8/8/8/8/KN3N2 w - - 0 1', 'b1d2').sans).toEqual(['Nbd2']);
  });

  it('detects checkmate after the fool\'s mate', () => {
    const { position, sans } = play(INITIAL_FEN, 'f2f3', 'e7e5', 'g2g4', 'd8h4');
    expect(sans.at(-1)).toBe('Qh4#');
    expect(getPositionStatus(position).isCheckmate).toBe(true);
    expect(getAllLegalMoves(position)).toHaveLength(0);
  });

  it('detects stalemate and insufficient material', () => {
    expect(getPositionStatus(fenToPosition('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')).drawReason).toBe('stalemate');
    expect(hasInsufficientMaterial(fenToPosition('8/8/4k3/8/8/2B5/4K3/8 w - - 0 1').board)).toBe(true);
    expect(hasInsufficientMaterial(fenToPosition('8/8/4k3/8/8/2R5/4K3/8 w - - 0 1').board)).toBe(false);
  });
});
