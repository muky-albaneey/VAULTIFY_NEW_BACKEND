import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Provider } from './provider.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  service_id: string;

  @Column({ unique: true })
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToMany(() => Provider, (provider) => provider.service)
  providers: Provider[];
}
