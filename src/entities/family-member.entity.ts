import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FamilyGroup } from './family-group.entity';
import { User } from './user.entity';

@Entity('family_members')
export class FamilyMember {
  @PrimaryGeneratedColumn('uuid')
  family_member_id: string;

  @Column()
  family_group_id: string;

  @Column()
  user_id: string;

  @Column()
  added_by_user_id: string;

  @Column({ default: false })
  is_head: boolean;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => FamilyGroup, (group) => group.members)
  @JoinColumn({ name: 'family_group_id' })
  familyGroup: FamilyGroup;

  @ManyToOne(() => User, (user) => user.familyMemberships)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, (user) => user.addedFamilyMembers)
  @JoinColumn({ name: 'added_by_user_id' })
  addedBy: User;
}
