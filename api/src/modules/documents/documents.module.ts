import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DocumentEntity } from './document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentEntity])],
  exports: [TypeOrmModule],
})
export class DocumentsModule {}
