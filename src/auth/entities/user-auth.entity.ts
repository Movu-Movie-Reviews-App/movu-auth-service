import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import * as bcrypt from 'bcrypt';
import { VerificationCode } from "./verification-code.entity";
import { Exclude } from "class-transformer";

@Entity()
export class UserAuthEntity {



    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'text'
    })
    userName: string;

    @Column({
        type: 'text',
        unique: true
    })
    email: string;

    @Column({
        type: 'text',
        select: false
    })
    password: string;

    @Exclude()
    @OneToMany(() => VerificationCode, verificationCode => verificationCode.user, {
        cascade: true,
        eager: false
    })
    verificationCodes: VerificationCode[];

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if (this.password) {
            this.password = await bcrypt.hash(this.password, 10);
        }
    }

}