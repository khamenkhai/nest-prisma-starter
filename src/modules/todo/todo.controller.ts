import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Version, UseInterceptors, UploadedFile, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { TodoService } from './todo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entity/user.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiResponse } from 'src/common/utils/api-response';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions, sanitizeFileName } from 'src/common/config/multer.config';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/types/auth-request.interface';
import { UploadService } from '../upload/upload.service';

@ApiTags('Todo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('todo')
export class TodoController {
    constructor(private readonly todoService: TodoService, private readonly uploadService: UploadService) { }

    @ApiOperation({ summary: 'Create a new todo' })
    @Post()
    @Roles(UserRole.USER)
    async create(@Body() createTodoDto: CreateTodoDto, @Request() req) {
        const data = await this.todoService.create(createTodoDto, req.user);
        return ApiResponse.success('Todo created successfully', data);
    }

    @ApiOperation({ summary: 'Get all todos for the current user' })
    @Get()
    async findAll(@GetUser() user: AuthenticatedUser) {
        const result = await this.todoService.findAll(user.id);
        return ApiResponse.success(
            'Todos retrieved successfully',
            result.items || result,
            result.meta
        );
    }


    @ApiOperation({ summary: 'Get a specific todo by ID' })
    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req) {
        const data = await this.todoService.findOne(id, req.user.id);
        return ApiResponse.success('Todo retrieved successfully', data);
    }

    @ApiOperation({ summary: 'Update a specific todo by ID' })
    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto, @Request() req) {
        const data = await this.todoService.update(id, updateTodoDto, req.user.id);
        return ApiResponse.success('Todo updated successfully', data);
    }

    @ApiOperation({ summary: 'Delete a specific todo by ID' })
    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req) {
        await this.todoService.remove(id, req.user.id);
        return ApiResponse.success('Todo deleted successfully', null);
    }

    @ApiOperation({ summary: 'Create a new todo with an image (multipart/form-data)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                isCompleted: { type: 'boolean' },
                image: { type: 'string', format: 'binary' },
            },
            required: ['title'],

        },
    })

    @Post('with-image')
    @UseInterceptors(FileInterceptor('image', multerOptions))
    async createWithImage(
        @UploadedFile() file: Express.Multer.File,
        @Body() createTodoDto: CreateTodoDto,
        @Request() req
    ) {
        if (!file) {
            throw new BadRequestException('Image file is required');
        }

        const uploadBody = file.buffer || fs.createReadStream(file.path);


        const s3Url = await this.uploadService.uploadFile(
            sanitizeFileName(file.originalname),
            uploadBody,
            file.mimetype
        );

        (createTodoDto as any).image = s3Url;

        const data = await this.todoService.create(createTodoDto, req.user);

        return ApiResponse.success('Todo with image created successfully', data);
    }
}