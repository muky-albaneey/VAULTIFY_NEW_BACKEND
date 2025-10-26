import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Provider } from './provider.entity';

@Entity('provider_reviews')
export class ProviderReview {
  @PrimaryGeneratedColumn('uuid')
  provider_review_id: string;

  @Column()
  provider_id: string;

  @Column()
  reviewer_name: string;

  @Column({ type: 'int', default: 0 })
  rating: number;

  @Column({ nullable: true })
  comment: string;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => Provider, (provider) => provider.reviews)
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;
}
