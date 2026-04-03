import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { dataSourceOption } from './database/data-source';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TodoModule } from './modules/todo/todo.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from './common/logger/logger.module';
import { HttpLoggerMiddleware } from './common/logger/http-logger.middleware';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UploadModule } from './modules/upload/upload.module';
import { RolesModule } from './modules/roles/roles.module';
import { SeederModule } from './database/seeders/seeder.module';
import { ApiResponseInterceptor } from './common/interceptor/api-response.interceptor';

@Module({
  imports: [
    /// TO LOAD ENVIRONMENT VARIABLES
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    /// TO SERVE STATIC FILES
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public', 'uploads'),
      serveRoot: '/files',
      exclude: ['/api/(.*)'],
    }),
    /// TO LIMIT THE NUMBER OF REQUESTS PER USER
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short', // Prevents rapid-fire botting
          ttl: 1000, // 1 second
          limit: 3,
        },
        {
          name: 'medium', // Standard browsing speed
          ttl: 60000, // 1 minute
          limit: 60,
        },
        {
          name: 'long', // Overall daily safety net
          ttl: 86400000, // 1 day
          limit: 2000,
        },
      ],
    }),
    /// TO CONNECT TO DATABASE
    TypeOrmModule.forRoot(dataSourceOption),
    AuthModule,
    UsersModule,
    TodoModule,
    UploadModule,
    RolesModule,
    SeederModule,
  ],
  providers: [
    {
      /// TO APPLY THROTTLER GUARD TO ALL ROUTES
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
  ],

  controllers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
