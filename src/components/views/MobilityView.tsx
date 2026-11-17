/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Native Electric Vehicle & Bike Companion Dashboard
 * Main mobility dashboard presenting all 3 sections in full uniform fidelity
 * on both mobile and desktop viewports.
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Car,
  Bicycle,
  Sliders
} from '@phosphor-icons/react';
import { useMobilityData } from '../../hooks/useMobilityData';
import { useUserConfig } from '../../contexts/ConfigContext';
import { VehicleHeroCard } from '../mobility/VehicleHeroCard';
import { ChargingControlCard } from '../mobility/ChargingControlCard';
import { VehicleTelemetryMap } from '../mobility/VehicleTelemetryMap';
import SmoothTab from '../kokonutui/smooth-tab';
import { BikeTab } from './mobility/BikeTab';
import { VehicleCustomizerModal } from './mobility/VehicleCustomizerModal';
import { useAutoLayoutStore } from '../../store/useAutoLayoutStore';
import ViewLoadingState from '../ui/ViewLoadingState';

interface MobilityViewProps {
  darkMode?: boolean;
}

export default function MobilityView({ darkMode = true }: MobilityViewProps) {
  const isLoading = useAutoLayoutStore((s) => s.isLoading);
  const { config } = useUserConfig();
  const { carMetrics, bikeMetrics, actions } = useMobilityData();

  const [activeAsset, setActiveAsset] = useState<'car' | 'bike'>('car');
  const [customizerOpen, setCustomizerOpen] = useState(false);

  const hasBikeConfigured = useMemo(() => {
    return Boolean(
      config.mobility?.bike?.customName ||
      config.mobility?.bike?.bikeImageUrl ||
      (bikeMetrics && (bikeMetrics.batteryPercent ?? 0) > 0)
    );
  }, [config.mobility?.bike, bikeMetrics]);

  if (isLoading) {
    return (
      <ViewLoadingState
        title="Connecting to Vehicle Telemetry..."
        subtitle="Retrieving battery state of charge, range estimate, and GPS coordinates"
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col gap-3 sm:gap-4 animate-fadeIn -mt-2 sm:-mt-4 pb-12">
      {/* Top Header Bar: Tab Selector with Icon-only Customize button right next to it (No Fleet Badge) */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Top Asset Switcher ("Electric Car" & "Electric Bike") */}
          {hasBikeConfigured ? (
            <SmoothTab
              panels={false}
              label="Vehicle"
              value={activeAsset}
              onChange={(id) => setActiveAsset(id as 'car' | 'bike')}
              className="w-auto max-w-full"
              activeColor={activeAsset === 'bike' ? 'bg-amber-500' : 'bg-cyan-500'}
              activeTextColor="text-slate-950"
              items={[
                { id: 'car', title: `Electric Car ${carMetrics.soc != null ? `${Math.round(carMetrics.soc)}%` : '—'}` },
                { id: 'bike', title: `Electric Bike ${bikeMetrics.batteryPercent != null ? `${Math.round(bikeMetrics.batteryPercent)}%` : '—'}` },
              ]}
            />
          ) : (
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs ${
                  darkMode ? 'bg-cyan-500/15 text-cyan-400' : 'bg-cyan-100 text-cyan-800'
                }`}
              >
                <Car size={18} weight="duotone" />
              </div>
              <h1 className={`text-base sm:text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Electric Car
              </h1>
            </div>
          )}

          {/* Customize Button (Icon only, directly next to tab selector) */}
          <button
            type="button"
            onClick={() => setCustomizerOpen(true)}
            aria-label="Customize vehicle specs and photos"
            title="Customize"
            className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-[4px_6px_12px_rgba(0,0,0,0.15)] backdrop-blur-xl border text-cyan-600 dark:text-cyan-400 ${
              darkMode ? 'bg-black/20 hover:bg-black/30 border-white/5' : 'bg-white/20 hover:bg-white/30 border-slate-200/50'
            }`}
          >
            <Sliders size={18} weight="bold" />
          </button>
        </div>
      </header>

      {/* Main Content: Both Mobile & Desktop maintain the exact same rich layout */}
      {activeAsset === 'bike' ? (
        <motion.div
          key="bike-view"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="w-full flex-1"
        >
          <BikeTab
            metrics={bikeMetrics}
            actions={actions}
            onOpenCustomizer={() => setCustomizerOpen(true)}
            darkMode={darkMode}
          />
        </motion.div>
      ) : (
        /* ========================================================================= */
        /* ALL 3 SECTIONS: Maintaining identical layout on Mobile & Desktop           */
        /* Desktop: 3-column panoramic grid (equal height).                          */
        /* Mobile: 3 stacked full-featured sections with optimized mobile padding.   */
        /* ========================================================================= */
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          {/* Column 1: Automotive Hero, 40/60 Bento Cockpit & Action Dock */}
          <div className="lg:col-span-4 h-full flex flex-col">
            <VehicleHeroCard
              metrics={carMetrics}
              actions={actions}
              onOpenCustomizer={() => setCustomizerOpen(true)}
              darkMode={darkMode}
            />
          </div>

          {/* Column 2: High-Voltage Charging, SoC Arc Gauge, Slider & Controls */}
          <div className="lg:col-span-4 h-full flex flex-col">
            <ChargingControlCard
              metrics={carMetrics}
              actions={actions}
              darkMode={darkMode}
            />
          </div>

          {/* Column 3: GPS Mini-Map HUD, 24h Speed History & TPMS Visualizer */}
          <div className="lg:col-span-4 h-full flex flex-col">
            <VehicleTelemetryMap
              metrics={carMetrics}
              darkMode={darkMode}
            />
          </div>
        </div>
      )}

      {/* Vehicle & Asset Customizer Modal */}
      <VehicleCustomizerModal
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        target={activeAsset}
        currentCarName={config.mobility?.car?.customName}
        currentCarTargetSoc={config.mobility?.car?.targetSocDefault}
        currentCarBatteryCapacity={config.mobility?.car?.batteryCapacityKwh}
        currentCarImage={carMetrics.customVehicleImage}
        currentCarLogo={carMetrics.customBrandLogo}
        currentBikeName={config.mobility?.bike?.customName}
        currentBikeImage={bikeMetrics.customBikeImage}
        currentBikeLogo={bikeMetrics.customBrandLogo}
        onSaveAsset={actions.saveCustomAsset}
        onSaveSettings={actions.saveVehicleSettings}
        onResetAssets={actions.resetCustomAssets}
        darkMode={darkMode}
      />
    </div>
  );
}
