import {
  DEFAULT_PLATFORM_SETTINGS,
  PlatformSettings,
} from '../../domain/entities/PlatformSettings';
import { PlatformSettingsReader } from '../../domain/ports/PlatformSettingsReader';

export class InMemoryPlatformSettingsReader implements PlatformSettingsReader {
  public settings: PlatformSettings = DEFAULT_PLATFORM_SETTINGS;

  public async current(): Promise<PlatformSettings> {
    return this.settings;
  }

  public given(overrides: Partial<PlatformSettings>): this {
    this.settings = { ...this.settings, ...overrides };
    return this;
  }
}
