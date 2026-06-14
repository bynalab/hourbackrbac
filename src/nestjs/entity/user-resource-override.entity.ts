import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

export enum ResourceOverrideEffect {
  ALLOW = 'allow',
  DENY = 'deny',
}

@Entity('user_resource_overrides')
@Unique(['user_id', 'resource_id'])
export class UserResourceOverride {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @Column({ name: 'resource_id', length: 128 })
  resource_id: string;

  @Column({ type: 'varchar', length: 8 })
  effect: ResourceOverrideEffect;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
