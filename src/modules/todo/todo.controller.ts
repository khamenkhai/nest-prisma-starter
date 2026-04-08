import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import * as fs from 'fs';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { TodoService } from './todo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  multerOptions,
  sanitizeFileName,
} from 'src/common/config/multer.config';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/types/auth-request.interface';
import { UploadService } from '../upload/upload.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PermissionsGuard } from '../auth/guards/permission.guard';
import { RequirePermissions } from '../auth/decorators/permission.decorator';
import { StaticModules } from 'src/common/const/modules.type';
import { ActivityAction } from 'src/common/const/action.type';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@ApiTags('Todo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('todo')
export class TodoController {
  constructor(
    private readonly todoService: TodoService,
    private readonly uploadService: UploadService,
  ) {}

  @ApiOperation({ summary: 'Create a new todo' })
  @Post()
  @RequirePermissions({
    module: StaticModules.TODO,
    action: ActivityAction.CREATE,
  })
  @ResponseMessage('Created Todo Successfully!')
  async create(@Body() createTodoDto: CreateTodoDto, @Request() req) {
    const data = await this.todoService.create(createTodoDto, req.user);
    return data;
  }

  @ApiOperation({ summary: 'Get all todos for the current user' })
  @Get()
  @RequirePermissions({
    module: StaticModules.TODO,
    action: ActivityAction.READ,
  })
  @ResponseMessage('Fetched All Todos Successfully')
  async findAll(
    @GetUser() user: AuthenticatedUser,
    @Query() paginationDto: PaginationDto,
  ) {
    const { page, limit } = paginationDto;
    const result = await this.todoService.findAll(user.id, page, limit);

    return result;
  }

  @ApiOperation({ summary: 'Get a specific todo by ID' })
  @Get(':id')
  @RequirePermissions({
    module: StaticModules.TODO,
    action: ActivityAction.READ,
  })
  @ResponseMessage('Fetched Todo Details Successfully')
  async findOne(@Param('id') id: string, @Request() req) {
    const data = await this.todoService.findOne(id, req.user.id);
    return data;
  }

  @ApiOperation({ summary: 'Update a specific todo by ID' })
  @Patch(':id')
  @RequirePermissions({
    module: StaticModules.TODO,
    action: ActivityAction.UPDATE,
  })
  @ResponseMessage('Updated Todo Successfully')
  async update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
    @Request() req,
  ) {
    const data = await this.todoService.update(id, updateTodoDto, req.user.id);
    return data;
  }

  @ApiOperation({ summary: 'Delete a specific todo by ID' })
  @Delete(':id')
  @RequirePermissions({
    module: StaticModules.TODO,
    action: ActivityAction.DELETE,
  })
  @ResponseMessage('Deleted Todo Successfully')
  async remove(@Param('id') id: string, @Request() req) {
    const data = await this.todoService.remove(id, req.user.id);
    return data;
  }

  @ApiOperation({
    summary: 'Create todo with an image (form-data)',
  })
  @ApiConsumes('multipart/form-data')
  @RequirePermissions({
    module: StaticModules.TODO,
    action: ActivityAction.CREATE,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          example: 'Summer Vacation 2026',
        },
        description: {
          type: 'string',
          example: 'A collection of photos from the trip to Italy.',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Upload the image file here',
        },
      },
      required: ['title'],
    },
  })
  @Post('with-image')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @ResponseMessage('Created Todo with Image Successfully')
  async createWithImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() createTodoDto: CreateTodoDto,
    @Request() req,
  ) {
    let key: string = '';

    if (file) {
      const uploadBody = file.buffer || fs.createReadStream(file.path);

      const uploadResult = await this.uploadService.uploadFile(
        sanitizeFileName(file.originalname),
        uploadBody,
        file.mimetype,
      );
      key = uploadResult.key;
    }

    (createTodoDto as any).image = key;

    const todo = await this.todoService.create(createTodoDto, req.user);

    if (todo.image) {
      todo.image = await this.uploadService.getPresignedUrl(todo.image);
    }

    return todo;
  }
}
