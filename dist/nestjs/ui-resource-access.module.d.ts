import { DynamicModule } from '@nestjs/common';
import { type ResourceAccessModuleOptions } from './options';
export declare class UiResourceAccessModule {
    static forRoot(options: ResourceAccessModuleOptions): DynamicModule;
}
