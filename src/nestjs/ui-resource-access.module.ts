import { DynamicModule, Module, Type } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserResourceOverride } from './entity/user-resource-override.entity';
import { ResourceAccessService } from './resource-access.service';
import { ResourceAccessGuard } from './resource-access.guard';
import { ResourceAccessAdminGuard } from './resource-access-admin.guard';
import {
  RESOURCE_ACCESS_OPTIONS,
  resolveOptions,
  type ResourceAccessModuleOptions,
} from './options';
import { createResourceAccessController } from './controllers/resource-access.controller';
import { createResourceAccessAdminController } from './controllers/resource-access-admin.controller';

@Module({})
export class UiResourceAccessModule {
  static forRoot(options: ResourceAccessModuleOptions): DynamicModule {
    const resolved = resolveOptions(options);
    const authGuards = options.authGuards ?? [];
    const adminGuards = options.adminGuards ?? [];

    const controllers = resolved.registerControllers
      ? [
          createResourceAccessController(authGuards),
          createResourceAccessAdminController(
            resolved.adminControllerPath,
            authGuards,
            adminGuards,
          ),
        ]
      : [];

    return {
      module: UiResourceAccessModule,
      imports: [TypeOrmModule],
      controllers,
      providers: [
        { provide: RESOURCE_ACCESS_OPTIONS, useValue: resolved },
        ResourceAccessAdminGuard,
        ResourceAccessGuard,
        {
          provide: ResourceAccessService,
          useFactory: (opts: typeof resolved, dataSource: DataSource) =>
            new ResourceAccessService(
              opts,
              dataSource.getRepository(UserResourceOverride),
              dataSource.getRepository(opts.userEntity as never),
            ),
          inject: [RESOURCE_ACCESS_OPTIONS, DataSource],
        },
      ],
      exports: [ResourceAccessService, ResourceAccessGuard, ResourceAccessAdminGuard],
      global: false,
    };
  }
}
