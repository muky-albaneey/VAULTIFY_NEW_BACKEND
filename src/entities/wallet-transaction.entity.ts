import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Wallet } from './wallet.entity';

export enum TransactionDirection {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum TransactionPurpose {
  TOP_UP = 'top_up',
  SUBSCRIPTION_PAYMENT = 'subscription_payment',
  UTILITY_PAYMENT = 'utility_payment',
  SERVICE_CHARGE_PAYMENT = 'service_charge_payment',
  REFUND = 'refund',
  TRANSFER = 'transfer',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('wallet_transactions')
@Index(['reference'], { unique: true })
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  wallet_txn_id: string;

  @Column()
  wallet_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionDirection,
  })
  direction: TransactionDirection;

  @Column({
    type: 'enum',
    enum: TransactionPurpose,
  })
  purpose: TransactionPurpose;

  @Column({ unique: true })
  reference: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;
}
