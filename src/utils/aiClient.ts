import { GamePosition } from '@/types/chess';
import { AiMove, getBestMove } from './chessAI';

type AiResponse = { id: number; move: AiMove | null };

export interface AiRequest {
  promise: Promise<AiMove | null>;
  cancel: () => void;
}

export function createAiClient() {
  let worker: Worker | null = null;
  let nextId = 0;

  const spawn = () => {
    try {
      worker = new Worker(new URL('./chessAI.worker.ts', import.meta.url), { type: 'module' });
    } catch {
      worker = null;
    }
    return worker;
  };

  const request = (position: GamePosition, difficulty: number): AiRequest => {
    const current = worker ?? spawn();
    if (!current) {
      return {
        promise: new Promise(resolve => setTimeout(() => resolve(getBestMove(position, difficulty)), 0)),
        cancel: () => {}
      };
    }

    const id = ++nextId;
    let settled = false;
    const promise = new Promise<AiMove | null>(resolve => {
      const onMessage = (event: MessageEvent<AiResponse>) => {
        if (event.data.id !== id) return;
        settled = true;
        current.removeEventListener('message', onMessage);
        resolve(event.data.move);
      };
      current.addEventListener('message', onMessage);
      current.postMessage({ id, position, difficulty });
    });

    return {
      promise,
      cancel: () => {
        if (settled) return;
        current.terminate();
        if (worker === current) worker = null;
      }
    };
  };

  const dispose = () => {
    worker?.terminate();
    worker = null;
  };

  return { request, dispose };
}
