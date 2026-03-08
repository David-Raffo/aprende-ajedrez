# Aprende ajedrez con un entrenador

Aplicación web de ajedrez para jugar contra una IA local, con un panel de
entrenador que analiza cada jugada a través de un webhook externo (n8n).

## Tecnologías

- React 18 + TypeScript
- Vite 5
- Tailwind CSS v3 + shadcn/ui
- IA local: minimax con poda alfa-beta (5 niveles de dificultad)
- Sonido con Web Audio API

## Requisitos

- Node.js 18 o superior (o Bun)

## Instalación

```bash
npm install
```

## Ejecutar en desarrollo

```bash
npm run dev
```

La app se abrirá en http://localhost:8080

## Compilar para producción

```bash
npm run build
```

Los archivos listos para publicar quedan en la carpeta `dist/`.

## Configuración del entrenador

El webhook del entrenador se configura con la variable de entorno
`VITE_COACH_WEBHOOK_URL` (copia `.env.example` a `.env`). La app envía por POST un JSON con la jugada
(origen, destino, pieza, captura, color del jugador) y el estado del
tablero en notación FEN antes y después del movimiento. El webhook debe
responder con un objeto JSON:

```json
{
  "isGoodMove": true,
  "rating": "buena",
  "improvement": "Sugerencia de mejora",
  "explanation": "Explicación de la jugada"
}
```

Valores de `rating`: excelente, buena, imprecisa, error, grave.

---

Desarrollado por David Raffo
