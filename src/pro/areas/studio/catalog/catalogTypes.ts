/** The shapes behind the Area Tiles Studio catalog: a concept, a type entry, and `entry` to widen one. */
import type { ComponentType } from 'react';
import type { TileModel, TileProps, TileSize } from '../../tileTypes';
import type { MockState } from '../areaStates';

export type TileConceptId = 'A' | 'B' | 'C' | 'D';

export interface TileConcept<M extends TileModel> {
  id: TileConceptId;
  name: string;
  idea: string;
  interaction: string;
  strengths: string[];
  tradeoffs: string[];
  /** Sizes this concept is designed for (default: Small, Wide, Tall, Large). */
  sizes?: readonly TileSize[];
  Component: ComponentType<TileProps<M>>;
}

export interface TileTypeEntry<M extends TileModel> {
  id: M['kind'];
  title: string;
  /** Review batch (1 in review; 2–5 Ambient style previews only). */
  batch: number;
  domains: string;
  /** What this tile is for, in one line. */
  job: string;
  sizes: readonly TileSize[];
  states: MockState<M>[];
  concepts: TileConcept<M>[];
  recommended: TileConceptId;
  /** The owner's choice, once made, and what to change in it. */
  chosen?: { concept: TileConceptId; notes: string };
  why: string;
  /** Extra studio controls for this type (e.g. the car's picture), editing the live entity. */
  Tools?: ComponentType<{ e: M; onChange: (m: M) => void }>;
}

export const entry = <M extends TileModel>(e: TileTypeEntry<M>) => e as unknown as TileTypeEntry<TileModel>;
