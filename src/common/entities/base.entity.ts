import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, DeleteDateColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export abstract class BaseEntity {
  @PrimaryGeneratedColumn( 'uuid' )
  id?: string;

  @ManyToOne( () => User )
  createdBy: User;

  @ManyToOne( () => User )
  updatedBy?: User;

  @CreateDateColumn( { type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' } )
  createdAt?: Date;

  @UpdateDateColumn( { type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' } )
  updatedAt?: Date;

  @Column( { nullable: true } )
  ipAddress?: string;

  @Column( { nullable: true } )
  userAgent?: string;

  @DeleteDateColumn()
  deletedAt?: Date;
}