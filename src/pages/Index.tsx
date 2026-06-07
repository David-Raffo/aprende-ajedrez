import { ChessBoard } from '@/components/ChessBoard';
import { GameStatus } from '@/components/GameStatus';
import { GameControls } from '@/components/GameControls';
import { CoachPanel } from '@/components/CoachPanel';
import { PromotionDialog } from '@/components/PromotionDialog';
import { MoveHistory } from '@/components/MoveHistory';
import { isCoachEnabled, useChessGame } from '@/hooks/useChessGame';
import { Bot, Crown, UserRound } from 'lucide-react';

const Index = () => {
  const {
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
    startNewGame,
    setAiDifficulty,
    changePlayerColor,
    lastMoveAnalysis,
    isAnalyzing
  } = useChessGame();

  return (
    <main className="min-h-screen bg-gradient-radial px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-5 flex items-end justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-primary">Chess with Raffo</p>
              <h1 className="text-2xl leading-tight sm:text-3xl">Aprende ajedrez con un entrenador</h1>
            </div>
          </div>
          <p className="hidden max-w-xs text-right text-sm text-muted-foreground md:block">Partida guiada contra inteligencia artificial</p>
        </header>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[250px_minmax(520px,1fr)_320px]">
          <aside className="order-3 flex w-full flex-col gap-4 xl:order-1">
            <GameStatus 
              gameState={gameState}
              isPlayerTurn={isPlayerTurn}
              isAiThinking={isAiThinking}
              playerColor={playerColor}
            />
            <GameControls
              onNewGame={startNewGame}
              onDifficultyChange={setAiDifficulty}
              onColorChange={changePlayerColor}
              difficulty={aiDifficulty}
              playerColor={playerColor}
              gameInProgress={gameState.moveHistory.length > 0}
            />
          </aside>

          <section className="order-1 flex min-w-0 flex-col items-center gap-3 xl:order-2">
            <div className="flex w-full max-w-[min(76vh,680px)] items-center justify-between border border-border bg-card/70 px-3 py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-muted-foreground"><Bot className="h-4 w-4" /></div>
                <div><p className="text-sm font-semibold">Rival IA</p><p className="text-xs text-muted-foreground">Nivel {aiDifficulty} de 5</p></div>
              </div>
              <span className="font-notation text-xs text-muted-foreground">{playerColor === 'white' ? 'NEGRAS' : 'BLANCAS'}</span>
            </div>
            <ChessBoard
              board={gameState.position.board}
              selectedSquare={gameState.selectedSquare}
              validMoves={gameState.validMoves}
              lastMove={lastMove}
              checkSquare={checkSquare}
              onSquareClick={handleSquareClick}
              onMove={tryMove}
              isPlayerTurn={isPlayerTurn}
              playerColor={playerColor}
            >
              {pendingPromotion && <PromotionDialog color={playerColor} onSelect={choosePromotion} />}
            </ChessBoard>
            <div className="flex w-full max-w-[min(76vh,680px)] items-center justify-between border border-border bg-card/70 px-3 py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><UserRound className="h-4 w-4" /></div>
                <div><p className="text-sm font-semibold">Tú</p><p className="text-xs text-muted-foreground">{isAiThinking ? 'La IA está pensando…' : isPlayerTurn ? 'Tu turno' : 'Esperando rival'}</p></div>
              </div>
              <span className="font-notation text-xs text-primary">{playerColor === 'white' ? 'BLANCAS' : 'NEGRAS'}</span>
            </div>

            <div className="mt-2 w-full xl:hidden">
              <CoachPanel lastAnalysis={lastMoveAnalysis} isAnalyzing={isAnalyzing} enabled={isCoachEnabled} />
            </div>
          </section>

          <aside className="order-2 flex w-full flex-col gap-4 xl:order-3">
            <div className="hidden xl:block">
              <CoachPanel lastAnalysis={lastMoveAnalysis} isAnalyzing={isAnalyzing} enabled={isCoachEnabled} />
            </div>
            
            <MoveHistory moves={gameState.moveHistory} />
          </aside>
        </div>
        
        <footer className="mt-10 border-t border-border pt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Desarrollado por David Raffo
          </p>
        </footer>
      </div>
    </main>
  );
};

export default Index;
