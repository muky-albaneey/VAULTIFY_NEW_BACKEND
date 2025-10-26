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
import { User } from './user.entity';
import { Plan } from './plan.entity';
import { FamilyMember } from './family-member.entity';

@Entity('family_groups')
export class FamilyGroup {
  @PrimaryGeneratedColumn('uuid')
  family_group_id: string;

  @Column()
  head_user_id: string;

  @Column()
  plan_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.headedFamilyGroups)
  @JoinColumn({ name: 'head_user_id' })
  headUser: User;

  @ManyToOne(() => Plan, (plan) => plan.familyGroups)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @OneToMany(() => FamilyMember, (member) => member.familyGroup)
  members: FamilyMember[];
}
