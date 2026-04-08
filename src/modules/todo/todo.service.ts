import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoEntity } from './entity/todo.entity';
import { UserEntity } from '../users/entity/user.entity';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(TodoEntity)
    private todoRepository: Repository<TodoEntity>,
    private readonly uploadService: UploadService,
  ) {}

  async create(createTodoDto: any, user: UserEntity): Promise<TodoEntity> {
    const todo = this.todoRepository.create({
      ...createTodoDto,
      user,
    });
    return this.todoRepository.save(todo) as any;
  }

  async findAll(userId: string, page: number = 1, limit: number = 10) {
    const [items, totalItems] = await this.todoRepository.findAndCount({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const itemsWithUrls = await Promise.all(
      items.map(async (todo) => {
        if (todo.image) {
          todo.image = await this.uploadService.getPresignedUrl(todo.image);
        }
        return todo;
      }),
    );

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: itemsWithUrls,
      meta: {
        totalItems,
        itemCount: itemsWithUrls.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  async findOne(id: string, userId: string): Promise<TodoEntity> {
    const todo = await this.todoRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    if (todo.image) {
      todo.image = await this.uploadService.getPresignedUrl(todo.image);
    }

    return todo;
  }

  async update(
    id: string,
    updateTodoDto: any,
    userId: string,
  ): Promise<TodoEntity> {
    const todo = await this.findOne(id, userId);
    Object.assign(todo, updateTodoDto);
    return this.todoRepository.save(todo);
  }

  async remove(id: string, userId: string): Promise<void> {
    const todo = await this.findOne(id, userId);
    await this.todoRepository.remove(todo);
  }
}
