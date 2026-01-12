import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findOne(id: string): Promise<User | null> {
        return this.usersRepository.findOneBy({ id });
    }

    async syncUser(createUserDto: CreateUserDto): Promise<User> {
        let user = await this.findOne(createUserDto.id);

        if (!user) {
            user = this.usersRepository.create(createUserDto);
        } else {
            // Update fields if they exist in the DTO
            if (createUserDto.email) user.email = createUserDto.email;
            if (createUserDto.displayName) user.displayName = createUserDto.displayName;
            if (createUserDto.photoUrl) user.photoUrl = createUserDto.photoUrl;
        }

        return this.usersRepository.save(user);
    }
}
