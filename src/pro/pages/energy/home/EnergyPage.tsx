/**
 * The Energy page, approved 2026-11-26 (docs/pro-ui/ENERGY.md §0, direction C): Right now as one
 * answer plus numbers with sparklines; Today as the power chart with sun, price and carbon lanes
 * under it; then the cards, a Bento on tablets and desktop (headline contents) and Tiles + detail
 * on phones (chart-first contents). The Energy Studio renders this same component, swapping parts
 * through the props to compare alternatives.
 */
import type { ComponentType } from 'react';
import { CardsBento, CardsTiles } from './cards';
import { SKIN_CHART, SKIN_HEADLINE } from './cardContents';
import { NowNumbers } from './now';
import { BlockSkin, type DesignProps } from './parts';
import { TodayLanes } from './today';

type Skin = Parameters<typeof BlockSkin.Provider>[0]['value'];

export interface EnergyPageProps extends DesignProps {
  Now?: ComponentType<DesignProps>;
  Today?: ComponentType<DesignProps>;
  Cards?: ComponentType<DesignProps>;
  /** Studio only: a card content style to try instead; null draws the plain round-1 blocks. */
  skin?: Skin | null;
}

export default function EnergyPage({ home, width, Now = NowNumbers, Today = TodayLanes, Cards = CardsBento, skin }: EnergyPageProps) {
  const phone = width < 640;
  const settled = skin === undefined ? (phone ? SKIN_CHART : SKIN_HEADLINE) : (skin ?? {});
  return (
    <div className="flex flex-col gap-6">
      <Now home={home} width={width} />
      <Today home={home} width={width} />
      <BlockSkin.Provider value={settled}>{phone ? <CardsTiles home={home} width={width} /> : <Cards home={home} width={width} />}</BlockSkin.Provider>
    </div>
  );
}
