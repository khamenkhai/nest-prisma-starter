import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Version, UseInterceptors, UploadedFile, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator, BadRequestException, Query } from '@nestjs/common';
import * as fs from 'fs';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { TodoService } from './todo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiResponse } from 'src/common/utils/api-response';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions, sanitizeFileName } from 'src/common/config/multer.config';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/types/auth-request.interface';
import { UploadService } from '../upload/upload.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PermissionsGuard } from '../auth/guards/permission.guard';
import { RequirePermissions } from '../auth/decorators/permission.decorator';
import { StaticModules } from 'src/common/const/modules.type';
import { ActivityAction } from 'src/common/const/action.type';

@ApiTags('Todo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('todo')
export class TodoController {
    constructor(private readonly todoService: TodoService, private readonly uploadService: UploadService) { }

    @ApiOperation({ summary: 'Create a new todo' })
    @Post()
    @RequirePermissions({
        module: StaticModules.TODO,
        action: ActivityAction.CREATE,
    })
    async create(@Body() createTodoDto: CreateTodoDto, @Request() req) {
        const data = await this.todoService.create(createTodoDto, req.user);
        return ApiResponse.success('Todo created successfully', data);
    }

    @ApiOperation({ summary: 'Get all todos for the current user' })
    @Get()
    @RequirePermissions({
        module: StaticModules.TODO,
        action: ActivityAction.READ,
    })
    async findAll(
        @GetUser() user: AuthenticatedUser,
        @Query() paginationDto: PaginationDto
    ) {
        const { page, limit } = paginationDto;
        const result = await this.todoService.findAll(user.id, page, limit);

        return ApiResponse.success(
            'Todos retrieved successfully',
            result.items,
            result.meta
        );
    }

    @ApiOperation({ summary: 'Get a specific todo by ID' })
    @Get(':id')
    @RequirePermissions({
        module: StaticModules.TODO,
        action: ActivityAction.READ,
    })
    async findOne(@Param('id') id: string, @Request() req) {
        const data = await this.todoService.findOne(id, req.user.id);
        return ApiResponse.success('Todo retrieved successfully', data);
    }

    @ApiOperation({ summary: 'Update a specific todo by ID' })
    @Patch(':id')
    @RequirePermissions({
        module: StaticModules.TODO,
        action: ActivityAction.UPDATE,
    })
    async update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto, @Request() req) {
        const data = await this.todoService.update(id, updateTodoDto, req.user.id);
        return ApiResponse.success('Todo updated successfully', data);
    }

    @ApiOperation({ summary: 'Delete a specific todo by ID' })
    @Delete(':id')
    @RequirePermissions({
        module: StaticModules.TODO,
        action: ActivityAction.DELETE,
    })
    async remove(@Param('id') id: string, @Request() req) {
        await this.todoService.remove(id, req.user.id);
        return ApiResponse.success('Todo deleted successfully', null);
    }

    @ApiOperation({ summary: 'Create a new todo with an image (multipart/form-data)' })
    @ApiConsumes('multipart/form-data')
    @RequirePermissions({
        module: StaticModules.TODO,
        action: ActivityAction.CREATE,
    })
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