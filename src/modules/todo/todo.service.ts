// src/modules/todo/todo.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { TodoEntity } from './entity/todo.entity';
import { UserEntity } from '../users/entity/user.entity';
import { UploadService } from '../upload/upload.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { sanitizeFileName } from 'src/common/config/multer.config';
import { PaginatedResponse } from 'src/common/interfaces/api-response.interface';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(TodoEntity)
    private todoRepository: Repository<TodoEntity>,
    private readonly uploadService: UploadService,
  ) {}

  async create(
    createTodoDto: CreateTodoDto,
    user: UserEntity,
  ): Promise<TodoEntity> {
    const todo = this.todoRepository.create({
      ...createTodoDto,
      user,
    });
    return this.todoRepository.save(todo);
  }

  async createWithImage(
    createTodoDto: CreateTodoDto,
    user: UserEntity,
    file?: Express.Multer.File,
  ): Promise<TodoEntity> {
    let imageKey: string = '';

    if (file) {
      imageKey = await this.uploadImage(file);
    }

    const todo = this.todoRepository.create({
      ...createTodoDto,
      image: imageKey,
      user,
    });

    const savedTodo = await this.todoRepository.save(todo);

    // Generate presigned URL for the response
    if (savedTodo.image) {
      savedTodo.image = await this.uploadService.getPresignedUrl(
        savedTodo.image,
      );
    }

    return savedTodo;
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<TodoEntity>> {
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
    updateTodoDto: UpdateTodoDto,
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

  private async uploadImage(file: Express.Multer.File): Promise<string> {
    const uploadBody = file.buffer || fs.createReadStream(file.path);

    const uploadResult = await this.uploadService.uploadFile(
      sanitizeFileName(file.originalname),
      uploadBody,
      file.mimetype,
    );

    return uploadResult.key;
  }
}
