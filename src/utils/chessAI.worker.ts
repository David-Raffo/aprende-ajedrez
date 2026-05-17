import { GamePosition } from '@/types/chess';
import { getBestMove } from './chessAI';

type Request = { id: number; position: GamePosition; difficulty: number };

self.onmessage = (event: MessageEvent<Request>) => {
  const { id, position, difficulty } = event.data;
  self.postMessage({ id, move: getBestMove(position, difficulty) });
};
