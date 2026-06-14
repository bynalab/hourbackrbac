"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var UiResourceAccessModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UiResourceAccessModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_resource_override_entity_1 = require("./entity/user-resource-override.entity");
const resource_access_service_1 = require("./resource-access.service");
const resource_access_guard_1 = require("./resource-access.guard");
const resource_access_admin_guard_1 = require("./resource-access-admin.guard");
const options_1 = require("./options");
const resource_access_controller_1 = require("./controllers/resource-access.controller");
const resource_access_admin_controller_1 = require("./controllers/resource-access-admin.controller");
let UiResourceAccessModule = UiResourceAccessModule_1 = class UiResourceAccessModule {
    static forRoot(options) {
        const resolved = (0, options_1.resolveOptions)(options);
        const authGuards = options.authGuards ?? [];
        const adminGuards = options.adminGuards ?? [];
        const controllers = resolved.registerControllers
            ? [
                (0, resource_access_controller_1.createResourceAccessController)(authGuards),
                (0, resource_access_admin_controller_1.createResourceAccessAdminController)(resolved.adminControllerPath, authGuards, adminGuards),
            ]
            : [];
        return {
            module: UiResourceAccessModule_1,
            imports: [typeorm_1.TypeOrmModule],
            controllers,
            providers: [
                { provide: options_1.RESOURCE_ACCESS_OPTIONS, useValue: resolved },
                resource_access_admin_guard_1.ResourceAccessAdminGuard,
                resource_access_guard_1.ResourceAccessGuard,
                {
                    provide: resource_access_service_1.ResourceAccessService,
                    useFactory: (opts, dataSource) => new resource_access_service_1.ResourceAccessService(opts, dataSource.getRepository(user_resource_override_entity_1.UserResourceOverride), dataSource.getRepository(opts.userEntity)),
                    inject: [options_1.RESOURCE_ACCESS_OPTIONS, typeorm_2.DataSource],
                },
            ],
            exports: [resource_access_service_1.ResourceAccessService, resource_access_guard_1.ResourceAccessGuard, resource_access_admin_guard_1.ResourceAccessAdminGuard],
            global: false,
        };
    }
};
exports.UiResourceAccessModule = UiResourceAccessModule;
exports.UiResourceAccessModule = UiResourceAccessModule = UiResourceAccessModule_1 = __decorate([
    (0, common_1.Module)({})
], UiResourceAccessModule);
