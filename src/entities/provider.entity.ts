import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Service } from './service.entity';
import { User } from './user.entity';
import { Estate } from './estate.entity';
import { ProviderPhoto } from './provider-photo.entity';
import { ProviderReview } from './provider-review.entity';

@Entity('providers')
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  provider_id: string;

  @Column()
  service_id: string;

  @Column()
  admin_user_id: string;

  @Column()
  estate_id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  phone: string;

  @Column()
  location: string;

  @Column({ nullable: true })
  availability: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  skill: string;

  @Column({ nullable: true })
  profile_picture_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Service, (service) => service.providers)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ManyToOne(() => User, (user) => user.managedProviders)
  @JoinColumn({ name: 'admin_user_id' })
  admin: User;

  @ManyToOne(() => Estate, (estate) => estate.providers)
  @JoinColumn({ name: 'estate_id' })
  estate: Estate;

  @OneToMany(() => ProviderPhoto, (photo) => photo.provider)
  photos: ProviderPhoto[];

  @OneToMany(() => ProviderReview, (review) => review.provider)
  reviews: ProviderReview[];
}
