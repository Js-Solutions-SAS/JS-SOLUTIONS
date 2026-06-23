import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';

import { okResponse } from '../shared/contracts/api-response';
import { ListProspectsDto } from './dto/list-prospects.dto';
import { SearchProspectsDto } from './dto/search-prospects.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';
import { ProspectEntity } from './prospect.entity';

interface CityConfig {
  label: string;
  bbox: [number, number, number, number];
}

interface VerticalConfig {
  label: string;
  tags: Array<{ key: string; value: string }>;
  offer: string;
  sourceLabel: string;
  highIntent: boolean;
  nameHints?: string[];
}

interface OverpassElement {
  id?: number | string;
  type?: string;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
}

interface NormalizedProspect {
  source: 'osm';
  osmId: string;
  osmType: string;
  businessName: string;
  category: string;
  vertical: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  lat: number | null;
  lon: number | null;
  city: string;
  mapsUrl: string;
  sourceQuery: string;
  leadScore: number;
  recommendedOffer: string;
  status: string;
  nextActionAt: string;
  optOut: boolean;
}

const CITIES: Record<string, CityConfig> = {
  bogota: { label: 'Bogota', bbox: [4.471, -74.223, 4.837, -73.992] },
  medellin: { label: 'Medellin', bbox: [6.157, -75.671, 6.356, -75.501] },
  cali: { label: 'Cali', bbox: [3.314, -76.614, 3.546, -76.443] },
  pereira: { label: 'Pereira', bbox: [4.741, -75.796, 4.879, -75.622] },
};

const VERTICALS: Record<string, VerticalConfig> = {
  odontologias: {
    label: 'Odontologias',
    tags: [{ key: 'amenity', value: 'dentist' }],
    offer: 'Sistema Comercial Web + WhatsApp + Agenda + Cotizacion',
    sourceLabel: 'amenity=dentist',
    highIntent: true,
  },
  oftalmologicas: {
    label: 'Oftalmologicas y opticas',
    tags: [
      { key: 'healthcare', value: 'ophthalmology' },
      { key: 'healthcare', value: 'optometrist' },
      { key: 'shop', value: 'optician' },
    ],
    offer: 'Landing de Especialidad + WhatsApp + Agenda + Captacion Local',
    sourceLabel: 'healthcare=ophthalmology|optometrist, shop=optician',
    highIntent: true,
  },
  centros_estetica: {
    label: 'Centros de estetica',
    tags: [
      { key: 'shop', value: 'beauty' },
      { key: 'shop', value: 'cosmetics' },
      { key: 'leisure', value: 'spa' },
    ],
    offer: 'Sistema Comercial Web + WhatsApp + Agenda + Seguimiento',
    sourceLabel: 'shop=beauty|cosmetics, leisure=spa',
    highIntent: true,
  },
  restaurantes_cafes: {
    label: 'Restaurantes y cafes',
    tags: [
      { key: 'amenity', value: 'restaurant' },
      { key: 'amenity', value: 'cafe' },
    ],
    offer: 'Web de Conversion + WhatsApp + Reservas/Pedidos',
    sourceLabel: 'amenity=restaurant|cafe',
    highIntent: false,
  },
  inmobiliarias: {
    label: 'Inmobiliarias',
    tags: [{ key: 'office', value: 'estate_agent' }],
    offer: 'Landing de Captacion + WhatsApp + CRM de Oportunidades',
    sourceLabel: 'office=estate_agent',
    highIntent: true,
  },
  servicios_tecnicos: {
    label: 'Servicios tecnicos',
    tags: [
      { key: 'shop', value: 'electronics' },
      { key: 'shop', value: 'computer' },
      { key: 'craft', value: 'electrician' },
      { key: 'craft', value: 'plumber' },
      { key: 'office', value: 'it' },
    ],
    nameHints: ['servicio tecnico', 'reparacion', 'mantenimiento'],
    offer: 'Web Local + WhatsApp + Solicitudes y Seguimiento',
    sourceLabel: 'shop/craft/office technical services',
    highIntent: true,
  },
  gimnasios: {
    label: 'Gimnasios y centros fitness',
    tags: [
      { key: 'leisure', value: 'fitness_centre' },
      { key: 'leisure', value: 'sports_centre' },
    ],
    offer: 'Landing de Captacion + WhatsApp + Planes/Membresias',
    sourceLabel: 'leisure=fitness_centre|sports_centre',
    highIntent: true,
  },
  veterinarias: {
    label: 'Veterinarias',
    tags: [{ key: 'amenity', value: 'veterinary' }],
    offer: 'Web Local + WhatsApp + Agenda + Urgencias',
    sourceLabel: 'amenity=veterinary',
    highIntent: true,
  },
  abogados: {
    label: 'Abogados',
    tags: [{ key: 'office', value: 'lawyer' }],
    offer: 'Landing Profesional + WhatsApp + Consulta Inicial',
    sourceLabel: 'office=lawyer',
    highIntent: true,
  },
};

const PROSPECT_STATUSES = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'interesado', label: 'Interesado' },
  { value: 'descartado', label: 'Descartado' },
];

const CONTACT_FILTERS = [
  { value: 'all', label: 'Todos los canales' },
  { value: 'whatsapp', label: 'Con WhatsApp' },
  { value: 'email', label: 'Con email' },
  { value: 'both', label: 'WhatsApp + email' },
  { value: 'none', label: 'Sin contacto' },
];

const WEBSITE_FILTERS = [
  { value: 'all', label: 'Todas las webs' },
  { value: 'no_website', label: 'Sin web' },
  { value: 'has_website', label: 'Con web' },
];

@Injectable()
export class ProspectsService {
  constructor(
    @InjectRepository(ProspectEntity)
    private readonly prospectsRepository: Repository<ProspectEntity>,
    private readonly configService: ConfigService,
  ) {}

  async list(filters: ListProspectsDto, correlationId: string) {
    const limit = Math.min(Math.max(filters.limit || 500, 1), 1000);
    const query = this.prospectsRepository.createQueryBuilder('prospect');

    if (filters.city) {
      query.andWhere('prospect.city = :city', { city: filters.city });
    }

    if (filters.vertical) {
      query.andWhere('prospect.vertical = :vertical', {
        vertical: filters.vertical,
      });
    }

    if (filters.status) {
      query.andWhere('prospect.status = :status', { status: filters.status });
    }

    this.applyContactFilter(query, filters.contact);
    this.applyWebsiteFilter(query, filters.website);

    const search = String(filters.q || '').trim();
    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('prospect.business_name ILIKE :search', {
            search: `%${search}%`,
          })
            .orWhere('prospect.category ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('prospect.address ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('prospect.phone ILIKE :search', { search: `%${search}%` })
            .orWhere('prospect.email ILIKE :search', { search: `%${search}%` })
            .orWhere('prospect.website ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('prospect.source_query ILIKE :search', {
              search: `%${search}%`,
            });
        }),
      );
    }

    const prospects = await query
      .orderBy('prospect.lead_score', 'DESC')
      .addOrderBy('prospect.updated_at', 'DESC')
      .take(limit)
      .getMany();

    return okResponse(
      prospects.map((prospect) => this.serialize(prospect)),
      correlationId,
    );
  }

  options(correlationId: string) {
    return okResponse(
      {
        cities: Object.values(CITIES).map((city) => ({
          value: city.label,
          label: city.label,
        })),
        verticals: Object.entries(VERTICALS).map(([value, vertical]) => ({
          value,
          label: vertical.label,
        })),
        statuses: PROSPECT_STATUSES,
        contacts: CONTACT_FILTERS,
        websites: WEBSITE_FILTERS,
      },
      correlationId,
    );
  }

  async searchAndImport(input: SearchProspectsDto, correlationId: string) {
    const limit = Math.min(Math.max(input.limit || 100, 1), 500);
    const city = this.resolveCity(input.city, input.bbox);
    const customQuery = String(input.query || '').trim();
    const verticalKey = customQuery
      ? slugify(customQuery)
      : slugify(input.vertical || 'custom');
    const vertical = customQuery
      ? this.buildCustomVertical(input)
      : VERTICALS[verticalKey] || this.buildCustomVertical(input);
    const query = this.buildOverpassQuery(city.bbox, vertical, input.query);
    const elements = await this.runOverpass(query);
    const seen = new Map<string, NormalizedProspect>();

    for (const element of elements) {
      if (seen.size >= limit) break;
      const prospect = this.normalizeElement({
        element,
        city: city.label,
        verticalKey,
        vertical,
        sourceQuery: `${vertical.sourceLabel} in ${city.label}`,
      });

      if (!prospect.businessName) continue;
      if (!this.matchesVerticalHints(prospect, vertical)) continue;

      seen.set(`${prospect.osmType}/${prospect.osmId}`, prospect);
    }

    const imported = await this.upsertProspects([...seen.values()]);

    return okResponse(
      {
        searched: seen.size,
        imported: imported.created,
        updated: imported.updated,
        total: await this.prospectsRepository.count(),
        items: imported.items.map((prospect) => this.serialize(prospect)),
      },
      correlationId,
    );
  }

  async update(id: string, input: UpdateProspectDto, correlationId: string) {
    const prospect = await this.prospectsRepository.findOneByOrFail({ id });
    if (typeof input.status === 'string') prospect.status = input.status;
    if (typeof input.notes === 'string') prospect.notes = input.notes;
    const saved = await this.prospectsRepository.save(prospect);
    return okResponse(this.serialize(saved), correlationId);
  }

  private resolveCity(
    rawCity: string,
    bbox?: [number, number, number, number],
  ): CityConfig {
    const key = slugify(rawCity);
    const city = CITIES[key];
    if (city) return city;

    if (bbox?.length === 4 && bbox.every((value) => Number.isFinite(value))) {
      return { label: rawCity, bbox };
    }

    throw new BadRequestException(
      `Ciudad no soportada todavia: ${rawCity}. Usa Bogota, Medellin, Cali, Pereira o envia bbox.`,
    );
  }

  private buildCustomVertical(input: SearchProspectsDto): VerticalConfig {
    const query = String(input.query || input.vertical || '').trim();
    if (!query) {
      throw new BadRequestException('Debes enviar vertical o query.');
    }

    return {
      label: query,
      tags: [],
      offer: 'Landing Profesional + WhatsApp + Captacion Local',
      sourceLabel: `name~${query}`,
      highIntent: true,
    };
  }

  private buildOverpassQuery(
    bbox: [number, number, number, number],
    vertical: VerticalConfig,
    query?: string,
  ): string {
    const bboxPart = bbox.join(',');
    const clauses = vertical.tags.length
      ? vertical.tags
          .flatMap(({ key, value }) => [
            `node["${key}"="${value}"](${bboxPart});`,
            `way["${key}"="${value}"](${bboxPart});`,
            `relation["${key}"="${value}"](${bboxPart});`,
          ])
          .join('\n')
      : this.buildTextSearchClauses(bboxPart, query || vertical.label);

    return `[out:json][timeout:${this.overpassTimeoutSeconds()}];\n(\n${clauses}\n);\nout center tags;`;
  }

  private buildTextSearchClauses(bboxPart: string, query: string): string {
    const escaped = query.replace(/[\\"]/g, '\\$&');
    const named = `["name"~"${escaped}",i]`;
    const typed = [
      'amenity',
      'shop',
      'office',
      'craft',
      'leisure',
      'healthcare',
    ]
      .flatMap((key) => [
        `node[${key}]${named}(${bboxPart});`,
        `way[${key}]${named}(${bboxPart});`,
        `relation[${key}]${named}(${bboxPart});`,
      ])
      .join('\n');

    return typed;
  }

  private async runOverpass(query: string): Promise<OverpassElement[]> {
    const endpoint =
      this.configService.get<string>('OVERPASS_ENDPOINT') ||
      'https://overpass-api.de/api/interpreter';
    const body = new URLSearchParams({ data: query });
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent':
          this.configService.get<string>('OVERPASS_USER_AGENT') ||
          'JS-Solutions-Prospecting/1.0 (contact: sales@jssolutions.com.co)',
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new BadRequestException(
        `Overpass respondio ${response.status}: ${text.slice(0, 300)}`,
      );
    }

    const payload = (await response.json()) as { elements?: OverpassElement[] };
    return payload.elements || [];
  }

  private normalizeElement(input: {
    element: OverpassElement;
    city: string;
    verticalKey: string;
    vertical: VerticalConfig;
    sourceQuery: string;
  }): NormalizedProspect {
    const tags = input.element.tags || {};
    const lat = input.element.lat ?? input.element.center?.lat ?? null;
    const lon = input.element.lon ?? input.element.center?.lon ?? null;
    const prospect: NormalizedProspect = {
      source: 'osm',
      osmId: String(input.element.id || ''),
      osmType: input.element.type || '',
      businessName: tags.name || tags.brand || tags.operator || '',
      category: input.vertical.label,
      vertical: input.verticalKey,
      address: formatAddress(tags),
      phone:
        tags.phone ||
        tags['contact:phone'] ||
        tags.mobile ||
        tags['contact:mobile'] ||
        '',
      website: cleanUrl(
        tags.website || tags['contact:website'] || tags.url || '',
      ),
      email: tags.email || tags['contact:email'] || '',
      lat,
      lon,
      city: input.city,
      mapsUrl: getOsmUrl(input.element, lat, lon),
      sourceQuery: input.sourceQuery,
      leadScore: 0,
      recommendedOffer: input.vertical.offer,
      status: 'nuevo',
      nextActionAt: nextActionDate(),
      optOut: false,
    };

    prospect.leadScore = scoreProspect(prospect, input.vertical);
    return prospect;
  }

  private matchesVerticalHints(
    prospect: NormalizedProspect,
    vertical: VerticalConfig,
  ): boolean {
    if (!vertical.nameHints?.length) return true;
    const haystack =
      `${prospect.businessName} ${prospect.address}`.toLowerCase();
    return vertical.nameHints.some((hint) => haystack.includes(hint));
  }

  private async upsertProspects(items: NormalizedProspect[]) {
    const saved: ProspectEntity[] = [];
    let created = 0;
    let updated = 0;

    for (const item of items.sort((a, b) => b.leadScore - a.leadScore)) {
      const existing = await this.prospectsRepository.findOne({
        where: {
          source: item.source,
          osmType: item.osmType,
          osmId: item.osmId,
        },
      });

      if (existing) {
        Object.assign(existing, {
          businessName: item.businessName,
          category: item.category,
          vertical: item.vertical,
          address: item.address || existing.address,
          phone: item.phone || existing.phone,
          website: item.website || existing.website,
          email: item.email || existing.email,
          lat: item.lat == null ? existing.lat : String(item.lat),
          lon: item.lon == null ? existing.lon : String(item.lon),
          city: item.city,
          mapsUrl: item.mapsUrl || existing.mapsUrl,
          sourceQuery: item.sourceQuery,
          leadScore: item.leadScore,
          recommendedOffer: item.recommendedOffer,
          lastSeenAt: new Date(),
        });
        saved.push(await this.prospectsRepository.save(existing));
        updated++;
        continue;
      }

      const entity = this.prospectsRepository.create({
        ...item,
        lat: item.lat == null ? null : String(item.lat),
        lon: item.lon == null ? null : String(item.lon),
        lastSeenAt: new Date(),
      });
      saved.push(await this.prospectsRepository.save(entity));
      created++;
    }

    return { created, updated, items: saved };
  }

  private serialize(prospect: ProspectEntity) {
    return {
      id: prospect.id,
      source: prospect.source,
      osmId: prospect.osmId,
      osmType: prospect.osmType,
      businessName: prospect.businessName,
      category: prospect.category,
      vertical: prospect.vertical,
      address: prospect.address,
      phone: prospect.phone,
      website: prospect.website,
      email: prospect.email,
      lat: prospect.lat == null ? null : Number(prospect.lat),
      lon: prospect.lon == null ? null : Number(prospect.lon),
      city: prospect.city,
      mapsUrl: prospect.mapsUrl,
      sourceQuery: prospect.sourceQuery,
      leadScore: prospect.leadScore,
      recommendedOffer: prospect.recommendedOffer,
      status: prospect.status,
      notes: prospect.notes,
      nextActionAt: prospect.nextActionAt,
      optOut: prospect.optOut,
      createdAt: prospect.createdAt.toISOString(),
      updatedAt: prospect.updatedAt.toISOString(),
    };
  }

  private overpassTimeoutSeconds(): number {
    const value = Number(
      this.configService.get<string>('OVERPASS_TIMEOUT_SECONDS', '25'),
    );
    return Number.isFinite(value) && value > 0 ? value : 25;
  }

  private applyContactFilter(
    query: SelectQueryBuilder<ProspectEntity>,
    contact?: string,
  ): void {
    const hasPhone = "NULLIF(BTRIM(prospect.phone), '') IS NOT NULL";
    const hasEmail = "NULLIF(BTRIM(prospect.email), '') IS NOT NULL";

    if (contact === 'whatsapp') {
      query.andWhere(hasPhone);
      return;
    }

    if (contact === 'email') {
      query.andWhere(hasEmail);
      return;
    }

    if (contact === 'both') {
      query.andWhere(hasPhone).andWhere(hasEmail);
      return;
    }

    if (contact === 'none') {
      query.andWhere(`NOT (${hasPhone})`).andWhere(`NOT (${hasEmail})`);
    }
  }

  private applyWebsiteFilter(
    query: SelectQueryBuilder<ProspectEntity>,
    website?: string,
  ): void {
    const hasWebsite = "NULLIF(BTRIM(prospect.website), '') IS NOT NULL";

    if (website === 'no_website') {
      query.andWhere(`NOT (${hasWebsite})`);
      return;
    }

    if (website === 'has_website') {
      query.andWhere(hasWebsite);
    }
  }
}

function slugify(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function formatAddress(tags: Record<string, string>): string {
  return [
    tags['addr:street'],
    tags['addr:housenumber'],
    tags['addr:neighbourhood'],
    tags['addr:suburb'],
    tags['addr:city'],
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function cleanUrl(value: string): string {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function getOsmUrl(
  element: OverpassElement,
  lat: number | null,
  lon: number | null,
): string {
  if (element.type && element.id) {
    return `https://www.openstreetmap.org/${element.type}/${element.id}`;
  }

  if (lat != null && lon != null) {
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`;
  }

  return '';
}

function scoreProspect(
  prospect: NormalizedProspect,
  vertical: VerticalConfig,
): number {
  let score = 25;
  if (prospect.phone) score += 25;
  if (!prospect.website && prospect.phone) score += 25;
  if (prospect.website && weakWebsiteSignal(prospect.website)) score += 15;
  if (prospect.email) score += 10;
  if (vertical.highIntent) score += 10;
  if (!prospect.phone && !prospect.website && !prospect.email) score -= 10;
  return Math.max(0, Math.min(score, 100));
}

function weakWebsiteSignal(website: string): boolean {
  const value = website.toLowerCase();
  return [
    'facebook.com',
    'instagram.com',
    'linktr.ee',
    'wixsite.com',
    'wix.com',
    'weebly.com',
    'site123',
    'blogspot.',
    'wordpress.com',
  ].some((signal) => value.includes(signal));
}

function nextActionDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}
