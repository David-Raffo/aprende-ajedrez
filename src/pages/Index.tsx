import { ChessBoard } from '@/components/ChessBoard';
import { GameStatus } from '@/components/GameStatus';
import { GameControls } from '@/components/GameControls';
import { CoachPanel } from '@/components/CoachPanel';
import { useChessGame } from '@/hooks/useChessGame';
import { Bot, Crown, Sparkles, UserRound } from 'lucide-react';

const Index = () => {
  const {
    gameState,
    isPlayerTurn,
    aiDifficulty,
    isAiThinking,
    playerColor,
    handleSquareClick,
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
              isPlayerTurn={isPlayerTurn && !isAiThinking} 
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
                <div><p className="text-sm font-semibold">Entrenador IA</p><p className="text-xs text-muted-foreground">Nivel {aiDifficulty} de 5</p></div>
              </div>
              <span className="font-notation text-xs text-muted-foreground">{playerColor === 'white' ? 'NEGRAS' : 'BLANCAS'}</span>
            </div>
            <ChessBoard
              board={gameState.board}
              selectedSquare={gameState.selectedSquare}
              validMoves={gameState.validMoves}
              onSquareClick={handleSquareClick}
              isPlayerTurn={isPlayerTurn && !isAiThinking}
              playerColor={playerColor}
            />
            <div className="flex w-full max-w-[min(76vh,680px)] items-center justify-between border border-border bg-card/70 px-3 py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><UserRound className="h-4 w-4" /></div>
                <div><p className="text-sm font-semibold">Tú</p><p className="text-xs text-muted-foreground">{isAiThinking ? 'La IA está pensando…' : isPlayerTurn ? 'Tu turno' : 'Esperando rival'}</p></div>
              </div>
              <span className="font-notation text-xs text-primary">{playerColor === 'white' ? 'BLANCAS' : 'NEGRAS'}</span>
            </div>

            <div className="mt-2 w-full xl:hidden">
              <CoachPanel 
                lastAnalysis={lastMoveAnalysis}
                isAnalyzing={isAnalyzing}
              />
            </div>
          </section>

          <aside className="order-2 flex w-full flex-col gap-4 xl:order-3">
            <div className="hidden xl:block">
              <CoachPanel 
                lastAnalysis={lastMoveAnalysis}
                isAnalyzing={isAnalyzing}
              />
            </div>
            
            <section className="border border-border bg-card/70">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-xl">Últimos movimientos</h2>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="min-h-40 p-5">
                {gameState.moveHistory.length > 0 ? (
                <div className="font-notation space-y-1.5 text-xs max-h-48 overflow-y-auto">
                  {gameState.moveHistory.slice(-5).map((move, index) => (
                    <div key={index} className="flex justify-between border-b border-border/60 py-2 last:border-0">
                      <span className="text-muted-foreground">
                        {gameState.moveHistory.length - 4 + index}.
                      </span>
                      <span>
                        {String.fromCharCode(97 + move.from.col)}{8 - move.from.row} → {' '}
                        {String.fromCharCode(97 + move.to.col)}{8 - move.to.row}
                        {move.capturedPiece && ' ×'}
                      </span>
                    </div>
                  ))}
                </div>) : <p className="flex min-h-28 items-center justify-center text-center text-sm text-muted-foreground">La notación aparecerá al comenzar la partida.</p>}
              </div>
            </section>
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
