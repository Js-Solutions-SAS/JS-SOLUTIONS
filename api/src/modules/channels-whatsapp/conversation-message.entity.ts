import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'conversation_messages' })
@Index('idx_conversation_messages_sandbox', ['sandboxId'])
@Index('idx_conversation_messages_external', ['externalMessageId'])
export class ConversationMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'sandbox_id', type: 'uuid' })
  sandboxId!: string;

  @Column({ name: 'provider', type: 'text' })
  provider!: string;

  @Column({ name: 'direction', type: 'text', default: 'inbound' })
  direction!: 'inbound' | 'outbound';

  @Column({ name: 'message_type', type: 'text', default: 'text' })
  messageType!: string;

  @Column({ name: 'external_message_id', type: 'text', nullable: true })
  externalMessageId!: string | null;

  @Column({ name: 'content_text', type: 'text', nullable: true })
  contentText!: string | null;

  @Column({ name: 'payload_json', type: 'jsonb', nullable: true })
  payloadJson!: Record<string, unknown> | null;

  @Column({ name: 'correlation_id', type: 'text' })
  correlationId!: string;

  @Column({ name: 'idempotency_key', type: 'text', nullable: true })
  idempotencyKey!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
