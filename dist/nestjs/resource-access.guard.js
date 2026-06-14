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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceAccessGuard = exports.REQUIRE_RESOURCE_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const resource_access_service_1 = require("./resource-access.service");
exports.REQUIRE_RESOURCE_KEY = 'require_resource';
let ResourceAccessGuard = class ResourceAccessGuard {
    constructor(reflector, resourceAccessService) {
        this.reflector = reflector;
        this.resourceAccessService = resourceAccessService;
    }
    async canActivate(context) {
        const resourceId = this.reflector.get(exports.REQUIRE_RESOURCE_KEY, context.getHandler());
        if (!resourceId) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user?.id) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const allowed = await this.resourceAccessService.canAccessResourceForUser(user.id, resourceId);
        if (!allowed) {
            throw new common_1.ForbiddenException(`Access denied for resource "${resourceId}"`);
        }
        return true;
    }
};
exports.ResourceAccessGuard = ResourceAccessGuard;
exports.ResourceAccessGuard = ResourceAccessGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        resource_access_service_1.ResourceAccessService])
], ResourceAccessGuard);
