import type { UnitScaling } from '../../lib/ScalingUtil.js';

export const FAN_CAPABILITIES_MAPPING = {
  switch: 'onoff',
  fan_switch: 'onoff',
  // fan_speed_percent can be both fan_speed and legacy_fan_speed
  // fan_speed can be both fan_speed and legacy_fan_speed
  switch_vertical: 'fan_swing_vertical',
  switch_horizontal: 'fan_swing_horizontal',
  child_lock: 'child_lock',
  temp: 'target_temperature',
  temp_current: 'measure_temperature',
  // colour_data - handled by superclass
  light: 'onoff.light',
  switch_led: 'onoff.light',
} as const;

export const FAN_LIGHT_CAPABILITIES_MAPPING = {
  light: 'onoff.light',
  switch_led: 'onoff.light',
  bright_value: 'dim',
  temp_value: 'light_temperature',
} as const;

export const FAN_CAPABILITIES = {
  read_write: [
    'switch',
    'fan_switch',
    'switch_horizontal',
    'switch_vertical',
    'child_lock',
    // Light
    'light',
    'switch_led',
  ],
  read_write_special: ['fan_speed', 'fan_speed_percent', 'temp'],
  read_only_special: ['temp_current'],
  setting: ['fan_direction'],
} as const;

export type HomeyFanSettings = {
  enable_light_support: boolean;
  fan_direction: 'forward' | 'backward';
};

export type TuyaFanSettings = {
  fan_direction: 'forward' | 'backward' | 'reverse';
};

type TemperatureScaling = UnitScaling<'C' | 'F'>;

export const tempSpecDefaultScaling = {
  unit: 'C',
  min: 0,
  max: 50,
  scale: 0,
  step: 1,
} as TemperatureScaling;

export const tempCurrentSpecDefaultScaling = {
  unit: 'C',
  min: 0,
  max: 1000,
  scale: 0,
  step: 1,
} as TemperatureScaling;
