import {
  Injectable,
  PLATFORM_ID,
  Inject,
  TransferState,
  makeStateKey,
  inject,
  provideAppInitializer,
  EnvironmentProviders,
} from '@angular/core';
import { isPlatformServer, isPlatformBrowser } from '@angular/common';

export interface AppConfig {
  oauth: {
    issuer: string;
    clientId: string;
  };
}

const CONFIG_KEY = makeStateKey<AppConfig>('appConfig');

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config: AppConfig | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private transferState: TransferState,
  ) {}

  async loadConfig(): Promise<void> {
    // During SSR, read config from env vars
    if (isPlatformServer(this.platformId)) {
      this.config = {
        oauth: {
          issuer: process.env['OAUTH_ISSUER'] || '',
          clientId: process.env['OAUTH_CLIENT_ID'] || '',
        },
      };
      this.transferState.set(CONFIG_KEY, this.config);
    }

    // In browser, try to read config from TransferState (injected during SSR)
    if (isPlatformBrowser(this.platformId) && this.transferState.hasKey(CONFIG_KEY)) {
      this.config = this.transferState.get(CONFIG_KEY, null);
      this.transferState.remove(CONFIG_KEY);
      return;
    } else if (isPlatformBrowser(this.platformId)) {
      // If not available in TransferState, fetch from API
      this.config = await fetch('/api/config').then((res) => res.json() as Promise<AppConfig>);
    }
  }

  getConfig(): AppConfig {
    if (!this.config) {
      throw new Error('Config not loaded. Call loadConfig() first.');
    }
    return this.config;
  }
}

export function provideAppConfig(): EnvironmentProviders {
  return provideAppInitializer(() => inject(ConfigService).loadConfig());
}
