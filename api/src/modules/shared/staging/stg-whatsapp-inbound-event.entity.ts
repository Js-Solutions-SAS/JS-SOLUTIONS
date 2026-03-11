import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'stg_whatsapp_inbound_events' })
export class StgWhatsappInboundEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'provider', type: 'text' })
  provider!: string;

  @Column({ name: 'external_chat_id', type: 'text' })
  externalChatId!: string;

  @Column({ name: 'external_message_id', type: 'text', nullable: true })
  externalMessageId!: string | null;

  @Column({ name: 'message_type', type: 'text' })
  messageType!: string;

  @Column({ name: 'payload_json', type: 'jsonb' })
  payloadJson!: Record<string, unknown>;

  @Column({ name: 'occurred_at', type: 'timestamptz', nullable: true })
  occurredAt!: Date | null;

  @Column({ name: 'correlation_id', type: 'text' })
  correlationId!: string;

  @Column({ name: 'idempotency_key', type: 'text', nullable: true })
  idempotencyKey!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
