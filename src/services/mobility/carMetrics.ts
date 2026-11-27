/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CarEvMetrics, isCarCharging, isCarPluggedIn } from '../../types/mobility';
import type { HAZone } from '../../types';
import { findEntity as findEntityIn, fordpassVin, parseNum, parseNumOptional, resolveZone } from './entityLookup';
import { generateSpeedTimeseries, type SpeedPoint } from './speedHistory';

export interface CarMetricsInput {
  states: Record<string, any>;
  resolvedZones: HAZone[];
  isDemo: boolean;
  targetSocDefault?: number;
  customBrandLogo?: string;
  customVehicleImage?: string;
  speedHistory: SpeedPoint[];
  /**
   * Optional: filled with the entity ids the derivation picked. Callers use it to recompute only
   * when one of those entities changes (or the set of entities does), not on every state event.
   */
  usedEntityIds?: Set<string>;
}

/** Pure derivation of car EV metrics from the HA entity map (no React, no side effects). */
export function deriveCarMetrics(input: CarMetricsInput): CarEvMetrics {
  const { resolvedZones, isDemo, speedHistory } = input;
  const states = input.states;
  const used = input.usedEntityIds;
  const vin = fordpassVin(states);
  // Every lookup goes through here, so the caller learns which entities the car reads.
  const findEntity = (map: Record<string, any>, domain: string, patterns: string[]) => {
    const found = findEntityIn(map, domain, patterns);
    if (used && typeof found?.entity_id === 'string') used.add(found.entity_id);
    return found;
  };
  const effectiveCarLogo = input.customBrandLogo;
  const effectiveCarImage = input.customVehicleImage;
  const trackerEntity = findEntity(states, 'device_tracker', [
    `sensor.fordpass_${vin}_tracker`,
    `fordpass_${vin}_tracker`,
    '_tracker',
    '_vehicle',
    '_car'
  ]);

  const ignitionEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_ignitionstatus`,
    `fordpass_${vin}_ignitionstatus`,
    '_ignitionstatus',
    '_ignition_state',
    'ignition'
  ]);

  const socEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_soc`,
    `fordpass_${vin}_soc`,
    '_soc',
    '_battery_level',
    '_state_of_charge',
    'battery_level',
    'state_of_charge',
    'ev_battery'
  ]);
  
  // Explicit lookup for range
  const rangeEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_elveh`,
    `fordpass_${vin}_elveh`,
    '_elveh',
    'electric_range',
    'remaining_range',
    'battery_range',
    'range'
  ]);

  const chargingEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_elvehcharging`,
    `fordpass_${vin}_elvehcharging`,
    '_elvehcharging',
    'charging_status',
    'charging_state',
    'charge_state'
  ]) || findEntity(states, 'binary_sensor', [
    '_charging',
    'charging'
  ]);

  const powerEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_elvehchargingpower`,
    `fordpass_${vin}_elvehchargingpower`,
    '_elvehchargingpower',
    'charging_power',
    'charger_power',
    'charge_rate'
  ]);

  const plugEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_elvehplug`,
    `fordpass_${vin}_elvehplug`,
    '_elvehplug',
    'plug_status',
    'charger_type'
  ]) || findEntity(states, 'binary_sensor', [
    '_plugged_in',
    '_charging_cable',
    'plugged_in'
  ]);

  const doorLockSensor = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_doorlock`,
    `fordpass_${vin}_doorlock`,
    '_doorlock',
    '_doors_locked'
  ]);

  const doorLockDomain = findEntity(states, 'lock', [
    `lock.fordpass_${vin}_doorlock`,
    `fordpass_${vin}_doorlock`,
    '_doorlock',
    '_doors',
    '_vehicle',
    '_car'
  ]);

  const windowEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_windowposition`,
    `fordpass_${vin}_windowposition`,
    '_windowposition',
    '_windows'
  ]);

  const odoEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_odometer`,
    `fordpass_${vin}_odometer`,
    '_odometer',
    'odometer',
    'mileage'
  ]);

  const alarmEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_alarm`,
    `fordpass_${vin}_alarm`,
    '_alarm'
  ]);

  const cabinTempEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_cabintemperature`,
    `fordpass_${vin}_cabintemperature`,
    '_cabintemperature',
    'inside_temperature',
    'cabin_temperature',
    'cabin_temp'
  ]);

  const indicatorsEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_indicators`,
    `fordpass_${vin}_indicators`,
    '_indicators'
  ]);

  const battery12VEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_battery`,
    `fordpass_${vin}_battery`,
    '_battery',
    '12v_battery',
    'battery_12v',
    'auxiliary_battery'
  ]);

  const outdoorTempEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_outsidetemp`,
    `fordpass_${vin}_outsidetemp`,
    '_outsidetemp',
    'outside_temperature',
    'outdoor_temp'
  ]);

  const climateEntity = findEntity(states, 'climate', [
    `climate.fordpass_${vin}`,
    '_vehicle',
    '_car',
    '_interior',
    'vehicle_climate'
  ]);

  const remoteClimateSwitch = findEntity(states, 'switch', [
    `switch.fordpass_${vin}_ignition`,
    `fordpass_${vin}_ignition`,
    '_ignition',
    '_climate',
    '_preconditioning'
  ]);

  const countdownEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_remotestartcountdown`,
    `fordpass_${vin}_remotestartcountdown`,
    '_remotestartcountdown'
  ]);

  const targetSocEntity = findEntity(states, 'number', [
    '_charge_limit',
    '_target_soc',
    '_target_charge',
    '_target_charge_limit',
    '_charging_limit',
    '_target_state_of_charge',
    '_battery_charge_limit',
    'charge_limit',
    'target_soc'
  ]) || findEntity(states, 'select', [
    `select.fordpass_${vin}_elvehtargetcharge`,
    `fordpass_${vin}_elvehtargetcharge`,
    '_elvehtargetcharge',
    '_target_charge',
    '_charge_limit',
    'target_charge'
  ]);

  const chargePortEntity = findEntity(states, 'lock', [
    '_charge_port',
    '_charge_port_latch',
    'charge_port'
  ]) || findEntity(states, 'switch', [
    '_charge_port',
    'charge_port'
  ]);

  const defrostSwitch = findEntity(states, 'switch', [
    '_defrost',
    '_windshield_defrost',
    'defrost'
  ]);

  const energyConsumedEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_lastenergyconsumed`,
    `fordpass_${vin}_lastenergyconsumed`,
    '_lastenergyconsumed'
  ]);

  const chargeLogEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_energytransferlogentry`,
    `fordpass_${vin}_energytransferlogentry`,
    '_energytransferlogentry'
  ]);

  const speedEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_speed`,
    `fordpass_${vin}_speed`,
    '_speed'
  ]);

  const gearEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_gearleverposition`,
    `fordpass_${vin}_gearleverposition`,
    '_gearleverposition'
  ]);

  const gpsSensor = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_gps`,
    `fordpass_${vin}_gps`,
    '_gps'
  ]);

  const lastRefreshEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_lastrefresh`,
    `fordpass_${vin}_lastrefresh`,
    '_lastrefresh'
  ]);

  const tirePressureSensor = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_tirepressure`,
    `fordpass_${vin}_tirepressure`,
    '_tirepressure',
    '_tire_pressure'
  ]);

  // Discrete tire pressure sensors fallback
  const tpFrontLeftEntity = findEntity(states, 'sensor', ['_tire_pressure_front_left', '_tire_pressure_fl', '_front_left_tire_pressure']);
  const tpFrontRightEntity = findEntity(states, 'sensor', ['_tire_pressure_front_right', '_tire_pressure_fr', '_front_right_tire_pressure']);
  const tpRearLeftEntity = findEntity(states, 'sensor', ['_tire_pressure_rear_left', '_tire_pressure_rl', '_rear_left_tire_pressure']);
  const tpRearRightEntity = findEntity(states, 'sensor', ['_tire_pressure_rear_right', '_tire_pressure_rr', '_rear_right_tire_pressure']);

  // Software updates entities
  const autoUpdatesSwitch = findEntity(states, 'switch', [
    `switch.fordpass_${vin}_autosoftwareupdates`,
    `fordpass_${vin}_autosoftwareupdates`,
    '_autosoftwareupdates'
  ]);

  const firmwareHistorySensor = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_firmwareupdatehistory`,
    `fordpass_${vin}_firmwareupdatehistory`,
    '_firmwareupdatehistory'
  ]);

  const firmwareStatusSensor = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_firmwareupgstatus`,
    `fordpass_${vin}_firmwareupgstatus`,
    '_firmwareupgstatus'
  ]);

  const lastFirmwareSensor = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_lastfirmwareupdate`,
    `fordpass_${vin}_lastfirmwareupdate`,
    '_lastfirmwareupdate'
  ]);

  const otaReadinessSensor = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_otareadiness`,
    `fordpass_${vin}_otareadiness`,
    '_otareadiness'
  ]);

  const otaScheduleSensor = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_otaschedule`,
    `fordpass_${vin}_otaschedule`,
    '_otaschedule'
  ]);

  const oilEntity = findEntity(states, 'sensor', [
    `sensor.fordpass_${vin}_oil`,
    `fordpass_${vin}_oil`,
    '_oil',
    'oil_life'
  ]);


  // Parse GPS - derive baseline from zone.home (fall back to SF only in demo mode)
  const homeZone = resolvedZones.find((z) => z.entity_id === 'zone.home' || z.name.toLowerCase() === 'home');
  let latitude = homeZone?.latitude ?? 0;
  let longitude = homeZone?.longitude ?? 0;
  if (isDemo && latitude === 0 && longitude === 0) {
    latitude = 37.7749;
    longitude = -122.4194;
  }

  if (gpsSensor?.attributes?.latitude && gpsSensor?.attributes?.longitude) {
    latitude = Number(gpsSensor.attributes.latitude);
    longitude = Number(gpsSensor.attributes.longitude);
  } else if (trackerEntity?.attributes?.latitude && trackerEntity?.attributes?.longitude) {
    latitude = Number(trackerEntity.attributes.latitude);
    longitude = Number(trackerEntity.attributes.longitude);
  } else if (typeof gpsSensor?.state === 'string' && gpsSensor.state.includes(',')) {
    const parts = gpsSensor.state.split(',').map((s: string) => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      latitude = parts[0];
      longitude = parts[1];
    }
  }

  const { zoneName, isAtHome } = resolveZone(latitude, longitude, trackerEntity?.state || gpsSensor?.state, resolvedZones);

  const soc = parseNumOptional(socEntity?.state) ?? (isDemo ? 84 : undefined);
  const speed = parseNumOptional(speedEntity?.state) ?? (isDemo ? 0 : undefined);
  const isMoving = (speed ?? 0) > 0;
  const gear = String(gearEntity?.state || (isDemo ? (isMoving ? 'D' : 'P') : 'P')).toUpperCase();
  const isCharging = chargingEntity ? isCarCharging(chargingEntity.state) : (isDemo ? true : false);
  const isPluggedIn = plugEntity ? isCarPluggedIn(plugEntity.state) : (isDemo ? true : false);

  // Accurate lock state resolution
  let doorsLocked = true;
  if (doorLockDomain && typeof doorLockDomain.state === 'string') {
    doorsLocked = doorLockDomain.state.toLowerCase() === 'locked';
  } else if (doorLockSensor && typeof doorLockSensor.state === 'string') {
    const st = doorLockSensor.state.trim().toLowerCase();
    if (st === 'unlocked' || st === 'unlock' || st === 'open' || st === 'off' || st === 'false') {
      doorsLocked = false;
    } else if (st === 'locked' || st === 'lock' || st === 'closed' || st === 'on' || st === 'true') {
      doorsLocked = true;
    } else if (st.includes('unlock')) {
      doorsLocked = false;
    } else if (st.includes('lock')) {
      doorsLocked = true;
    }
  }
  if (doorLockSensor?.attributes) {
    const attrs = doorLockSensor.attributes;
    const hasUnlockedDoor = Object.entries(attrs).some(([k, v]) => {
      if (typeof v === 'string' && (v.toLowerCase().includes('unlock') || v.toLowerCase() === 'open')) return true;
      return false;
    });
    if (hasUnlockedDoor) {
      doorsLocked = false;
    }
  }

  const remoteClimateActive = remoteClimateSwitch ? (
    remoteClimateSwitch.state === 'on'
  ) : (climateEntity ? climateEntity.state !== 'off' : false);

  const ignitionStatus = ignitionEntity?.state || (isMoving ? 'On' : remoteClimateActive ? 'RemoteStarted' : 'Off');
  const ignitionOn = ignitionStatus.toLowerCase() === 'on' || isMoving;

  // Tire Pressure attributes or individual entities
  const tpAttrs = tirePressureSensor?.attributes || {};
  const tpUnit = tpAttrs.unit_of_measurement || tpFrontLeftEntity?.attributes?.unit_of_measurement || 'bar';
  const tpFrontLeft = tpAttrs.FrontLeft || tpAttrs.front_left || tpAttrs.frontLeft || tpAttrs.FL || (tpFrontLeftEntity ? parseNum(tpFrontLeftEntity.state, 2.6) : (isDemo ? 2.6 : '--'));
  const tpFrontRight = tpAttrs.FrontRight || tpAttrs.front_right || tpAttrs.frontRight || tpAttrs.FR || (tpFrontRightEntity ? parseNum(tpFrontRightEntity.state, 2.6) : (isDemo ? 2.6 : '--'));
  const tpRearLeft = tpAttrs.RearLeft || tpAttrs.rear_left || tpAttrs.rearLeft || tpAttrs.RL || (tpRearLeftEntity ? parseNum(tpRearLeftEntity.state, 2.5) : (isDemo ? 2.5 : '--'));
  const tpRearRight = tpAttrs.RearRight || tpAttrs.rear_right || tpAttrs.rearRight || tpAttrs.RR || (tpRearRightEntity ? parseNum(tpRearRightEntity.state, 2.5) : (isDemo ? 2.5 : '--'));
  const tpStatus = tirePressureSensor?.state || (tpFrontLeftEntity ? 'Normal (All Systems OK)' : (isDemo ? 'Normal (All Systems OK)' : 'Unavailable'));

  const chargeLogUnit = chargeLogEntity?.attributes?.unit_of_measurement || 'kWh';
  let lastChargingLog: string | undefined = chargeLogEntity?.state ? String(chargeLogEntity.state) : (isDemo ? '+34.2 kWh added • 2h 15m @ 11.4 kW AC' : undefined);
  if (lastChargingLog && !isNaN(parseFloat(lastChargingLog)) && !lastChargingLog.toLowerCase().includes('kwh') && !lastChargingLog.toLowerCase().includes('wh')) {
    lastChargingLog = `${lastChargingLog} ${chargeLogUnit}`;
  }

  const defaultTargetSoc = input.targetSocDefault || 80;
  const targetSocParsed = targetSocEntity ? parseNum(targetSocEntity.state, defaultTargetSoc) : defaultTargetSoc;

  const base: CarEvMetrics = {
    customBrandLogo: effectiveCarLogo,
    customVehicleImage: effectiveCarImage,

    soc,
    battery12V: battery12VEntity?.state || (isDemo ? '14.2V' : undefined),
    battery12VUnit: battery12VEntity?.attributes?.unit_of_measurement || 'V',
    range: parseNumOptional(rangeEntity?.state) !== undefined ? Math.round(parseNumOptional(rangeEntity?.state)!) : (isDemo ? 214 : undefined),
    rangeUnit: rangeEntity?.attributes?.unit_of_measurement || 'km',
    chargingState: chargingEntity?.state || (isCharging ? 'Charging' : isPluggedIn ? 'Connected' : 'Disconnected'),
    chargingPowerKW: parseNumOptional(powerEntity?.state) ?? (isDemo ? (isCharging ? 11.4 : 0) : undefined),
    isPluggedIn,
    targetSoc: `${targetSocParsed}%`,
    targetSocPercent: targetSocParsed,
    lastTripEnergy: parseNumOptional(energyConsumedEntity?.state) ?? (isDemo ? 18.6 : undefined),
    lastTripEnergyUnit: energyConsumedEntity?.attributes?.unit_of_measurement || 'kWh',
    lastChargingLog,
    lastChargingLogUnit: chargeLogUnit,

    ignitionOn,
    ignitionStatus: String(ignitionStatus),
    isMoving,
    speed,
    speedUnit: speedEntity?.attributes?.unit_of_measurement || 'km/h',
    gearPosition: gear,
    odometer: parseNumOptional(odoEntity?.state) ?? (isDemo ? 24850 : undefined),
    odometerUnit: odoEntity?.attributes?.unit_of_measurement || 'km',
    cabinTemp: parseNumOptional(cabinTempEntity?.state || climateEntity?.attributes?.current_temperature) ?? (isDemo ? 21.5 : undefined),
    cabinTempUnit: cabinTempEntity?.attributes?.unit_of_measurement || '°C',
    outdoorTemp: parseNumOptional(outdoorTempEntity?.state) ?? (isDemo ? 14.0 : undefined),
    targetCabinTemp: parseNumOptional(climateEntity?.attributes?.temperature) ?? (isDemo ? 21.0 : undefined),
    climateHvacMode: climateEntity?.state || (remoteClimateActive ? 'heat' : 'off'),
    defrostActive: defrostSwitch ? defrostSwitch.state === 'on' : false,
    rearDefrostActive: false,
    seatHeatingDriver: 0,
    seatHeatingPassenger: 0,
    remoteClimateActive,
    remoteClimateTimeRemaining: parseNumOptional(countdownEntity?.state) ?? (remoteClimateActive ? 15 : undefined),
    hasClimate: Boolean(climateEntity || remoteClimateSwitch),
    chargePortOpen: chargePortEntity ? (chargePortEntity.state === 'open' || chargePortEntity.state === 'unlocked' || chargePortEntity.state === 'on') : false,

    doorsLocked,
    doorLockStatus: String(doorLockSensor?.state || (doorsLocked ? 'Locked' : 'Unlocked')),
    windowsClosed: windowEntity ? (windowEntity.state === 'closed' || windowEntity.state === 'off') : true,
    windowPositionStatus: String(windowEntity?.state || 'Closed'),
    alarmStatus: String(alarmEntity?.state || 'Armed (Perimeter Active)'),
    indicatorsStatus: String(indicatorsEntity?.state || 'Normal (All Systems OK)'),
    
    tirePressure: {
      status: String(tpStatus),
      unit: String(tpUnit),
      frontLeft: tpFrontLeft,
      frontRight: tpFrontRight,
      rearLeft: tpRearLeft,
      rearRight: tpRearRight
    },
    hasTirePressure: Boolean(tirePressureSensor || tpFrontLeftEntity),

    deepSleep: false,
    oilLifePercent: parseNumOptional(oilEntity?.state) ?? (isDemo ? 94 : undefined),

    softwareUpdates: {
      autoUpdatesEnabled: autoUpdatesSwitch ? autoUpdatesSwitch.state === 'on' : (isDemo ? true : false),
      firmwareHistory: String(firmwareHistorySensor?.state || (isDemo ? 'Ford Power-Up 6.8.0 Installed (Success)' : 'Unavailable')),
      firmwareStatus: String(firmwareStatusSensor?.state || (isDemo ? 'Up to date (No pending OTA)' : 'Unavailable')),
      lastFirmwareUpdate: String(lastFirmwareSensor?.state || (isDemo ? '2 weeks ago (v6.8.0)' : 'Unavailable')),
      otaReadiness: String(otaReadinessSensor?.state || (isDemo ? 'Ready (Battery & Cellular OK)' : 'Unavailable')),
      nextOtaCheck: String(otaScheduleSensor?.state || (isDemo ? 'Tonight @ 02:00 AM' : 'Unavailable'))
    },

    gps: { latitude, longitude },
    locationZone: zoneName,
    isAtHome,
    lastRefreshed: lastRefreshEntity?.state || (isDemo ? 'Just now' : 'Unavailable'),

    speedTimeseries: isDemo ? generateSpeedTimeseries(speed ?? 0) : speedHistory,

    controls: {
      lockDoorButtonId: `button.fordpass_${vin}_doorlock`,
      unlockDoorLockId: doorLockDomain?.entity_id || `lock.fordpass_${vin}_doorlock`,
      startClimateSwitchId: remoteClimateSwitch?.entity_id || `switch.fordpass_${vin}_ignition`,
      extendClimateButtonId: `button.fordpass_${vin}_extendremotestart`,
      flashHonkDefaultButtonId: `button.fordpass_${vin}_hafdefault`,
      updateDataButtonId: `button.fordpass_${vin}_update_data`,
      requestRefreshButtonId: `button.fordpass_${vin}_request_refresh`,
      startChargingButtonId: `button.fordpass_${vin}_evstart`,
      chargeSwitchId: `switch.fordpass_${vin}_elvehcharge`,
      autoSoftwareUpdatesSwitchId: `switch.fordpass_${vin}_autosoftwareupdates`,
      climateEntityId: climateEntity?.entity_id,
      targetSocEntityId: targetSocEntity?.entity_id,
      chargePortEntityId: chargePortEntity?.entity_id,
      defrostEntityId: defrostSwitch?.entity_id
    }
  };
  return base;
}
