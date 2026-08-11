import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserAuthEntity } from "./user-auth.entity";

@Entity()
export class VerificationCode {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => UserAuthEntity, user => user.verificationCodes, { onDelete: 'CASCADE', eager: false })
    user: UserAuthEntity;

    @Column({
        type: 'text'
    })
    email: string;

    @Column({
        type: 'text'
    })
    code: string;

    @Column({
        type: 'timestamp',
    })
    createdAt: Date;

    @Column({
        type: 'timestamp',
    })
    expiresAt: Date;

    @Column({
        type: 'boolean',
        default: false
    })
    used: boolean;
}