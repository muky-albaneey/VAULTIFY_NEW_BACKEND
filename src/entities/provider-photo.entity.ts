import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Provider } from './provider.entity';

@Entity('provider_photos')
export class ProviderPhoto {
  @PrimaryGeneratedColumn('uuid')
  provider_photo_id: string;

  @Column()
  provider_id: string;

  @Column()
  image_url: string;

  @CreateDateColumn()
  uploaded_at: Date;

  // Relationships
  @ManyToOne(() => Provider, (provider) => provider.photos)
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;
}
