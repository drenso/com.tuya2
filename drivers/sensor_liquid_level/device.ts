import TuyaOAuth2Device from '../../lib/TuyaOAuth2Device.js';
import { computeScaleFactor, handleScaleSetting, sendSetting } from '../../lib/TuyaOAuth2Util.js';
import type { SettingsEvent, TuyaStatus } from '../../types/TuyaTypes.js';
import {
  type HomeyLiquidLevelSettings,
  LIQUID_LEVEL_CAPABILITIES,
  LIQUID_LEVEL_CAPABILITIES_MAPPING,
} from './TuyaLiquidLevelConstants.js';

export default class TuyaOAuth2DeviceLiquidLevel extends TuyaOAuth2Device {
  public async onTuyaStatus(status: TuyaStatus, changedStatusCodes: string[]): Promise<void> {
    await super.onTuyaStatus(status, changedStatusCodes);

    // measure_liquid_level
    if (typeof status['liquid_level_percent'] === 'number') {
      const value = status['liquid_level_percent'];
      await this.safeSetCapabilityValue('measure_liquid_level', value);
      if (changedStatusCodes.includes('liquid_level_percent')) {
        await this.triggerChanged('measure_liquid_level', value);
      }
    }

    // measure_liquid_depth
    if (typeof status['liquid_depth'] === 'number') {
      const value = status['liquid_depth'] / computeScaleFactor(this.getSetting('liquid_depth_scaling'));
      await this.safeSetCapabilityValue('measure_liquid_depth', value);
      if (changedStatusCodes.includes('liquid_depth')) {
        await this.triggerChanged('measure_liquid_depth', value);
      }
    }

    // alarm_liquid_low, alarm_liquid_high
    if (typeof status['liquid_state'] === 'string') {
      const state = status['liquid_state'];
      await this.setLiquidAlarm('alarm_liquid_low', state === 'lower_alarm', changedStatusCodes);
      await this.setLiquidAlarm('alarm_liquid_high', state === 'upper_alarm', changedStatusCodes);
    }

    // Settings, kept in sync with changes made in the Tuya app
    for (const tuyaCapability of LIQUID_LEVEL_CAPABILITIES.setting) {
      if (typeof status[tuyaCapability] === 'number') {
        await this.safeSetSettingValue(tuyaCapability, status[tuyaCapability]);
      }
    }
    for (const tuyaCapability of LIQUID_LEVEL_CAPABILITIES.setting_scaled) {
      if (typeof status[tuyaCapability] === 'number') {
        const scaling = computeScaleFactor(this.getSetting(`${tuyaCapability}_scaling`));
        await this.safeSetSettingValue(tuyaCapability, status[tuyaCapability] / scaling);
      }
    }
  }

  private async setLiquidAlarm(capability: string, value: boolean, changedStatusCodes: string[]): Promise<void> {
    if (!this.hasCapability(capability)) {
      return;
    }

    const previous = this.getCapabilityValue(capability);
    await this.safeSetCapabilityValue(capability, value);

    if (changedStatusCodes.includes('liquid_state') && previous !== value) {
      await this.homey.flow
        .getDeviceTriggerCard(`sensor_liquid_level_${capability}_${value}`)
        .trigger(this)
        .catch(this.error);
    }
  }

  private async triggerChanged(capability: string, value: number): Promise<void> {
    await this.homey.flow
      .getDeviceTriggerCard(`sensor_liquid_level_${capability}_changed`)
      .trigger(this, { value })
      .catch(this.error);
  }

  public async onSettings(event: SettingsEvent<HomeyLiquidLevelSettings>): Promise<string | void> {
    const { newSettings, changedKeys } = event;

    if (
      (changedKeys.includes('max_set') || changedKeys.includes('mini_set')) &&
      newSettings.max_set > 0 && // 0 means the high level alarm has not been configured
      newSettings.mini_set >= newSettings.max_set
    ) {
      throw new Error(this.homey.__('liquid_level_alarm_range_invalid'));
    }

    await handleScaleSetting(this, event, 'liquid_depth_scaling', LIQUID_LEVEL_CAPABILITIES_MAPPING.liquid_depth).catch(
      this.error,
    );

    for (const tuyaCapability of LIQUID_LEVEL_CAPABILITIES.setting) {
      if (changedKeys.includes(tuyaCapability) && this.hasTuyaCapability(tuyaCapability)) {
        await sendSetting(this, tuyaCapability, newSettings[tuyaCapability], this.SETTING_LABELS);
      }
    }

    for (const tuyaCapability of LIQUID_LEVEL_CAPABILITIES.setting_scaled) {
      if (changedKeys.includes(tuyaCapability) && this.hasTuyaCapability(tuyaCapability)) {
        const scaling = computeScaleFactor(newSettings[`${tuyaCapability}_scaling`]);
        const value = Math.round(newSettings[tuyaCapability] * scaling);
        await sendSetting(this, tuyaCapability, value, this.SETTING_LABELS);
      }
    }
  }
}
