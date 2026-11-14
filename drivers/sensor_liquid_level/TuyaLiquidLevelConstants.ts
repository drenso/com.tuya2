export const LIQUID_LEVEL_CAPABILITIES_MAPPING = {
  liquid_level_percent: 'measure_liquid_level',
  liquid_depth: 'measure_liquid_depth',
} as const;

export const LIQUID_LEVEL_CAPABILITIES = {
  read_only: ['liquid_level_percent'],
  read_only_scaled: ['liquid_depth'],
  setting: ['max_set', 'mini_set'],
  setting_scaled: ['installation_height', 'liquid_depth_max'],
} as const;

export type HomeyLiquidLevelSettings = {
  max_set: number;
  mini_set: number;
  installation_height: number;
  liquid_depth_max: number;
  liquid_depth_scaling: '0' | '1' | '2' | '3';
  installation_height_scaling: '0' | '1' | '2' | '3';
  liquid_depth_max_scaling: '0' | '1' | '2' | '3';
};

export type TuyaLiquidLevelSettings = {
  max_set: number;
  mini_set: number;
  installation_height: number;
  liquid_depth_max: number;
};
