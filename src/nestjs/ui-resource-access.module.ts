import { DynamicModule, Module, Type } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  ResourceAccessService as CoreResourceAccessService,
  resolveServiceOptions,
} from '../server';
import { createTypeormResourceAccessStorage } from './adapters/typeorm-storage';
import { ResourceAccessGuard } from './resource-access.guard';
import { ResourceAccessAdminGuard } from './resource-access-admin.guard';
import { UserResourceOverride } from './entity/user-resource-override.entity';
import { ResourceAccessService } from './resource-access.service';
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
          useFactory: (opts: typeof resolved, dataSource: DataSource) => {
            const core = new CoreResourceAccessService(
              resolveServiceOptions(opts),
              createTypeormResourceAccessStorage(
                dataSource.getRepository(UserResourceOverride),
                dataSource.getRepository(opts.userEntity as never),
              ),
            );
            return new ResourceAccessService(core, opts);
          },
          inject: [RESOURCE_ACCESS_OPTIONS, DataSource],
        },
      ],
      exports: [ResourceAccessService, ResourceAccessGuard, ResourceAccessAdminGuard],
      global: false,
    };
  }
}
