// src/modules/todo/todo.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { sanitizeFileName } from 'src/common/config/multer.config';
import { PaginatedResponse } from 'src/common/interfaces/api-response.interface';
import { Todo, User } from 'src/database/generated/prisma/client';

@Injectable()
export class TodoService {
  constructor(
    private prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async create(
    createTodoDto: CreateTodoDto,
    user: User,
  ): Promise<Todo> {
    return this.prisma.todo.create({
      data: {
        ...createTodoDto,
        user: { connect: { id: user.id } },
      },
    });
  }

  async createWithImage(
    createTodoDto: CreateTodoDto,
    user: User,
    file?: Express.Multer.File,
  ): Promise<Todo> {
    let imageKey: string = '';

    if (file) {
      imageKey = await this.uploadImage(file);
    }

    const savedTodo = await this.prisma.todo.create({
      data: {
        ...createTodoDto,
        image: imageKey,
        user: { connect: { id: user.id } },
      },
    });

    // Generate presigned URL for the response
    if (savedTodo.image) {
      const presignedUrl = await this.uploadService.getPresignedUrl(
        savedTodo.image,
      );
      return { ...savedTodo, image: presignedUrl };
    }

    return savedTodo;
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<Todo>> {
    const skip = (page - 1) * limit;
    
    const [items, totalItems] = await Promise.all([
      this.prisma.todo.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      }),
      this.prisma.todo.count({
        where: { userId },
      }),
    ]);

    const itemsWithUrls = await Promise.all(
      items.map(async (todo) => {
        if (todo.image) {
          const presignedUrl = await this.uploadService.getPresignedUrl(todo.image);
          return { ...todo, image: presignedUrl };
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

  async findOne(id: string, userId: string): Promise<Todo> {
    const todo = await this.prisma.todo.findFirst({
      where: { id, userId },
    });

    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    if (todo.image) {
      const presignedUrl = await this.uploadService.getPresignedUrl(todo.image);
      return { ...todo, image: presignedUrl };
    }

    return todo;
  }

  async update(
    id: string,
    updateTodoDto: UpdateTodoDto,
    userId: string,
  ): Promise<Todo> {
    const todo = await this.findOne(id, userId);
    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    return this.prisma.todo.update({
      where: { id },
      data: updateTodoDto,
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.prisma.todo.delete({
      where: { id },
    });
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
