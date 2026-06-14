"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResourceAccessAdminController = createResourceAccessAdminController;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const resource_access_service_1 = require("../resource-access.service");
const resource_access_dto_1 = require("../dto/resource-access.dto");
const resource_access_admin_guard_1 = require("../resource-access-admin.guard");
const require_admin_roles_decorator_1 = require("../require-admin-roles.decorator");
function createResourceAccessAdminController(controllerPath, authGuards = [], extraGuards = []) {
    let ResourceAccessAdminController = class ResourceAccessAdminController {
        constructor(resourceAccessService) {
            this.resourceAccessService = resourceAccessService;
        }
        getResourceCatalogue() {
            return this.resourceAccessService.getCatalogue();
        }
        getUserResourceAccess(userId) {
            return this.resourceAccessService.getUserResourceAccess(userId);
        }
        batchUpdateResourceAccess(userId, dto) {
            return this.resourceAccessService.batchUpdateOverrides(userId, dto.items);
        }
        toggleResourceAccess(userId, dto) {
            return this.resourceAccessService.toggleResourceAccess(userId, dto.resource_id, dto.allowed);
        }
    };
    __decorate([
        (0, common_1.Get)('resource-catalogue'),
        (0, common_1.HttpCode)(common_1.HttpStatus.OK),
        (0, swagger_1.ApiOperation)({ summary: 'Resource tree (domains, pages, tiles, blocks)' }),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], ResourceAccessAdminController.prototype, "getResourceCatalogue", null);
    __decorate([
        (0, common_1.Get)('users/:userId/resource-access'),
        (0, common_1.HttpCode)(common_1.HttpStatus.OK),
        (0, swagger_1.ApiOperation)({ summary: 'Effective resource access for a user (admin editor)' }),
        __param(0, (0, common_1.Param)('userId')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", void 0)
    ], ResourceAccessAdminController.prototype, "getUserResourceAccess", null);
    __decorate([
        (0, common_1.Put)('users/:userId/resource-access/batch'),
        (0, common_1.HttpCode)(common_1.HttpStatus.OK),
        (0, swagger_1.ApiOperation)({ summary: 'Batch update allow/deny overrides' }),
        __param(0, (0, common_1.Param)('userId')),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String, resource_access_dto_1.BatchResourceAccessDto]),
        __metadata("design:returntype", void 0)
    ], ResourceAccessAdminController.prototype, "batchUpdateResourceAccess", null);
    __decorate([
        (0, common_1.Patch)('users/:userId/resource-access/toggle'),
        (0, common_1.HttpCode)(common_1.HttpStatus.OK),
        (0, swagger_1.ApiOperation)({ summary: 'Toggle a single resource allow/deny for a user' }),
        __param(0, (0, common_1.Param)('userId')),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String, resource_access_dto_1.ToggleResourceAccessDto]),
        __metadata("design:returntype", void 0)
    ], ResourceAccessAdminController.prototype, "toggleResourceAccess", null);
    ResourceAccessAdminController = __decorate([
        (0, swagger_1.ApiTags)('Admin - Resource Access (RBAC v2)'),
        (0, common_1.Controller)(controllerPath),
        (0, common_1.UseGuards)(...authGuards, resource_access_admin_guard_1.ResourceAccessAdminGuard, ...extraGuards),
        (0, require_admin_roles_decorator_1.RequireAdminRoles)(),
        (0, swagger_1.ApiBearerAuth)(),
        __metadata("design:paramtypes", [resource_access_service_1.ResourceAccessService])
    ], ResourceAccessAdminController);
    return ResourceAccessAdminController;
}
