import { getLayerById } from '../data/layers';
import type { Turn } from '../types/game';

export function normalizePlayers(players: string[]): string[] {
  const cleaned = players
    .map((player) => player.trim())
    .filter((player) => player.length > 0);

  return cleaned.length > 0 ? cleaned : ['Player 1'];
}

export function createScores(playerCount: number): number[] {
  return Array.from({ length: playerCount }, () => 0);
}

export function buildTurnDeck(layerIdOrLayer: { id: string; regions: { id: string }[] } | string, playerCount: number, roundsPerPlayer: number): Turn[] {
  const layer = typeof layerIdOrLayer === 'string' ? getLayerById(layerIdOrLayer) : layerIdOrLayer;
  const promptIds = layer.regions.map((region) => region.id);
  const totalTurns = Math.max(1, playerCount * roundsPerPlayer);
  const deck: Turn[] = [];
  let pool = shuffle(promptIds);

  for (let index = 0; index < totalTurns; index += 1) {
    if (pool.length === 0) {
      pool = shuffle(promptIds);
    }

    const promptRegionId = pool.shift() ?? promptIds[index % promptIds.length];
    deck.push({
      promptRegionId,
      playerIndex: index % playerCount,
    });
  }

  return deck;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

