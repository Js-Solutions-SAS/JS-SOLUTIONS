import { createHash } from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type MetaEventName = 'Lead' | 'ViewContent' | 'Search' | 'FindLocation';

type MetaUserDataInput = {
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  zip?: string | null;
  country?: string | null;
  externalId?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbc?: string | null;
  fbp?: string | null;
};

export type MetaConversionEventInput = {
  eventName: MetaEventName;
  eventTime?: number;
  eventSourceUrl?: string;
  actionSource?: 'website';
  eventId?: string;
  userData?: MetaUserDataInput;
  customData?: Record<string, unknown>;
  dataProcessingOptions?: string[];
  dataProcessingOptionsCountry?: number;
  dataProcessingOptionsState?: number;
};

@Injectable()
export class MetaConversionsApiService {
  private readonly logger = new Logger(MetaConversionsApiService.name);

  constructor(private readonly configService: ConfigService) {}

  private get pixelId(): string {
    return this.configService.get<string>('META_CAPI_PIXEL_ID', '').trim();
  }

  private get accessToken(): string {
    return this.configService.get<string>('META_CAPI_ACCESS_TOKEN', '').trim();
  }

  private get apiVersion(): string {
    return this.configService.get<string>('META_CAPI_API_VERSION', 'v22.0').trim();
  }

  private get testEventCode(): string {
    return this.configService.get<string>('META_CAPI_TEST_EVENT_CODE', '').trim();
  }

  private get isEnabled(): boolean {
    const enabledFlag = this.configService
      .get<string>('META_CAPI_ENABLED', 'true')
      .trim()
      .toLowerCase();

    if (enabledFlag === 'false' || enabledFlag === '0' || enabledFlag === 'off') {
      return false;
    }

    return Boolean(this.pixelId && this.accessToken);
  }

  private normalizeString(value?: string | null): string | null {
    if (!value) return null;
    const normalized = value.trim().toLowerCase();
    return normalized || null;
  }

  private normalizePhone(value?: string | null): string | null {
    if (!value) return null;
    const normalized = value.replace(/[^\d]/g, '');
    return normalized || null;
  }

  private normalizeGender(value?: string | null): string | null {
    const normalized = this.normalizeString(value);
    if (!normalized) return null;
    if (normalized.startsWith('m')) return 'm';
    if (normalized.startsWith('f')) return 'f';
    return null;
  }

  private hashSha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private maybeHash(value: string | null): string | undefined {
    if (!value) return undefined;
    return this.hashSha256(value);
  }

  private buildUserData(input?: MetaUserDataInput): Record<string, unknown> {
    const userData: Record<string, unknown> = {};

    const hashedEmail = this.maybeHash(this.normalizeString(input?.email));
    if (hashedEmail) userData.em = hashedEmail;

    const hashedPhone = this.maybeHash(this.normalizePhone(input?.phone));
    if (hashedPhone) userData.ph = hashedPhone;

    const hashedGender = this.maybeHash(this.normalizeGender(input?.gender));
    if (hashedGender) userData.ge = hashedGender;

    const hashedFirstName = this.maybeHash(this.normalizeString(input?.firstName));
    if (hashedFirstName) userData.fn = hashedFirstName;

    const hashedLastName = this.maybeHash(this.normalizeString(input?.lastName));
    if (hashedLastName) userData.ln = hashedLastName;

    const hashedCity = this.maybeHash(this.normalizeString(input?.city));
    if (hashedCity) userData.ct = hashedCity;

    const hashedZip = this.maybeHash(this.normalizeString(input?.zip));
    if (hashedZip) userData.zp = hashedZip;

    const hashedCountry = this.maybeHash(this.normalizeString(input?.country));
    if (hashedCountry) userData.country = hashedCountry;

    const hashedExternalId = this.maybeHash(
      this.normalizeString(input?.externalId),
    );
    if (hashedExternalId) userData.external_id = hashedExternalId;

    if (input?.clientIpAddress) userData.client_ip_address = input.clientIpAddress;
    if (input?.clientUserAgent)
      userData.client_user_agent = input.clientUserAgent;
    if (input?.fbc) userData.fbc = input.fbc;
    if (input?.fbp) userData.fbp = input.fbp;

    return userData;
  }

  private mapEvent(input: MetaConversionEventInput): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      event_name: input.eventName,
      event_time:
        input.eventTime && Number.isFinite(input.eventTime)
          ? Math.floor(input.eventTime)
          : Math.floor(Date.now() / 1000),
      action_source: input.actionSource || 'website',
      user_data: this.buildUserData(input.userData),
    };

    if (input.eventSourceUrl) payload.event_source_url = input.eventSourceUrl;
    if (input.eventId) payload.event_id = input.eventId;
    if (input.customData) payload.custom_data = input.customData;
    if (input.dataProcessingOptions)
      payload.data_processing_options = input.dataProcessingOptions;
    if (typeof input.dataProcessingOptionsCountry === 'number')
      payload.data_processing_options_country = input.dataProcessingOptionsCountry;
    if (typeof input.dataProcessingOptionsState === 'number')
      payload.data_processing_options_state = input.dataProcessingOptionsState;

    return payload;
  }

  async sendEvents(events: MetaConversionEventInput[]): Promise<void> {
    if (!events.length) return;

    if (!this.isEnabled) {
      this.logger.debug(
        'Meta CAPI deshabilitado o sin configuración completa (META_CAPI_PIXEL_ID / META_CAPI_ACCESS_TOKEN).',
      );
      return;
    }

    const payload: Record<string, unknown> = {
      data: events.map((event) => this.mapEvent(event)),
    };

    if (this.testEventCode) {
      payload.test_event_code = this.testEventCode;
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/${this.pixelId}/events?access_token=${encodeURIComponent(this.accessToken)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(
        `Meta CAPI HTTP ${response.status}: ${responseText || 'sin cuerpo de error'}`,
      );
    }

    try {
      const parsed = JSON.parse(responseText) as Record<string, unknown>;
      if (parsed.error) {
        throw new Error(`Meta CAPI error: ${JSON.stringify(parsed.error)}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Meta CAPI error')) {
        throw error;
      }
      this.logger.debug('Respuesta Meta CAPI no JSON, se asume aceptada.');
    }
  }
}
