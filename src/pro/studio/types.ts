import type { ComponentType } from 'react';
import type { WidgetSize } from '../lib/overviewLayout';
import type { ConceptId } from '../widgets/designRegistry';
import type { DesignedWidgetProps } from '../widgets/shared/WidgetSurface';

/** A named state with its mock model (e.g. "Rain", "Clear night"). */
export interface WidgetState<Model> {
  id: string;
  label: string;
  model: Model;
}

export interface StudioConcept<Model> {
  id: ConceptId;
  name: string;
  idea: string;
  strengths: string[];
  tradeoffs: string[];
  Component: ComponentType<DesignedWidgetProps<Model>>;
}

/** One widget's page in the studio: its states (mock data) and its three concepts. */
export interface StudioEntry<Model> {
  widgetId: string;
  title: string;
  personality: string;
  direction: string;
  sizes: readonly WidgetSize[];
  states: WidgetState<Model>[];
  concepts: StudioConcept<Model>[];
  recommended: ConceptId;
  why: string;
}

export const defineStudioEntry = <Model,>(entry: StudioEntry<Model>) => entry;
