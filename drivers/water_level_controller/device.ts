import TuyaOAuth2Device from '../../lib/TuyaOAuth2Device.js';
import { sendSetting } from '../../lib/TuyaOAuth2Util.js';
import type { SettingsEvent, TuyaStatus } from '../../types/TuyaTypes.js';
import type { HomeyWaterLevelControllerSettings } from './TuyaWaterLevelControllerConstants.js';

export default class TuyaOAuth2DeviceWaterLevelController extends TuyaOAuth2Device {
  public async onOAuth2Init(): Promise<void> {
    await super.onOAuth2Init();

    if (this.hasCapability('onoff')) {
      this.registerCapabilityListener('onoff', value => this.sendCommand({ code: 'switch', value }));
    }
  }

  public async onTuyaStatus(status: TuyaStatus, changedStatusCodes: string[]): Promise<void> {
    await super.onTuyaStatus(status, changedStatusCodes);

    if (typeof status['switch'] === 'boolean') {
      await this.safeSetCapabilityValue('onoff', status['switch']);
    }

    // The water level, reported on the code a water heater uses for its temperature
    if (typeof status['temp_current'] === 'number') {
      const value = status['temp_current'];
      await this.safeSetCapabilityValue('measure_liquid_level', value);
      if (changedStatusCodes.includes('temp_current')) {
        await this.homey.flow
          .getDeviceTriggerCard('water_level_controller_measure_liquid_level_changed')
          .trigger(this, { value })
          .catch(this.error);
      }
    }

    // The pump off level ("Level Off"), on the code a water heater uses for its target temperature
    if (typeof status['temp_set'] === 'number') {
      await this.safeSetSettingValue('level_off', `${status['temp_set']}`);
    }
  }

  public async onSettings(event: SettingsEvent<HomeyWaterLevelControllerSettings>): Promise<string | void> {
    if (event.changedKeys.includes('level_off') && this.hasTuyaCapability('temp_set')) {
      await sendSetting(this, 'temp_set', Number(event.newSettings.level_off), {
        temp_set: this.SETTING_LABELS['level_off'],
      });
    }
  }
}
