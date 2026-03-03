import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entity/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findOne(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'role', 'refreshToken']
    });
  }

  async findOneByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'role', 'refreshToken']
    });
  }

  async update(id: string, updateUserDto: Partial<UserEntity>): Promise<void> {
    await this.usersRepository.update(id, updateUserDto);
  }

  async updateRefreshToken(refreshToken: string, id: string): Promise<void> {
    await this.usersRepository.update(id, { refreshToken: refreshToken })
  }
}
