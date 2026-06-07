import { Badge } from '@/components/ui/badge';
import { Brain, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export interface MoveAnalysis {
  isGoodMove: boolean;
  rating: 'excelente' | 'buena' | 'imprecisa' | 'error' | 'grave';
  improvement: string;
  explanation: string;
}

interface CoachPanelProps {
  lastAnalysis: MoveAnalysis | null;
  isAnalyzing: boolean;
  enabled?: boolean;
}

export const CoachPanel = ({ lastAnalysis, isAnalyzing, enabled = true }: CoachPanelProps) => {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excelente': return 'bg-success text-foreground';
      case 'buena': return 'bg-primary text-primary-foreground';
      case 'imprecisa': return 'bg-warning text-primary-foreground';
      case 'error': return 'bg-destructive text-destructive-foreground';
      case 'grave': return 'bg-critical text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'excelente':
      case 'buena':
        return <CheckCircle className="w-4 h-4" />;
      case 'imprecisa':
        return <AlertCircle className="w-4 h-4" />;
      case 'error':
      case 'grave':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <section className="w-full border border-primary/25 bg-card/80 shadow-lg">
      <header className="flex items-center gap-3 border-b border-border p-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl leading-none">Entrenador</h2>
          <p className="mt-1 text-[11px] uppercase text-muted-foreground">Análisis de la última jugada</p>
        </div>
      </header>
      <div className="min-h-52 space-y-4 p-5">
        {isAnalyzing && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span>Analizando tu jugada...</span>
          </div>
        )}

        {lastAnalysis && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={`${getRatingColor(lastAnalysis.rating)} flex items-center gap-1 rounded-sm`}>
                {getRatingIcon(lastAnalysis.rating)}
                {lastAnalysis.rating.toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="border-l-2 border-primary pl-3">
                <h3 className="mb-1 text-xs font-medium uppercase text-muted-foreground">Evaluación</h3>
                <p className="text-sm leading-6">{lastAnalysis.explanation}</p>
              </div>

              <div>
                <h3 className="mb-1 text-xs font-medium uppercase text-muted-foreground">Siguiente idea</h3>
                <p className="text-sm leading-6">{lastAnalysis.improvement}</p>
              </div>
            </div>
          </div>
        )}

        {!enabled && (
          <div className="flex min-h-40 flex-col items-center justify-center text-center text-muted-foreground">
            <Brain className="mb-3 h-9 w-9 opacity-40" />
            <p className="max-w-60 text-sm leading-6">
              El entrenador no está configurado. Define <code className="font-notation text-xs text-primary">VITE_COACH_WEBHOOK_URL</code> para recibir análisis de cada jugada.
            </p>
          </div>
        )}

        {enabled && !lastAnalysis && !isAnalyzing && (
          <div className="flex min-h-40 flex-col items-center justify-center text-center text-muted-foreground">
            <Brain className="mb-3 h-9 w-9 opacity-40" />
            <p className="max-w-52 text-sm leading-6">Tu análisis aparecerá después de la primera jugada.</p>
          </div>
        )}
      </div>
    </section>
  );
};