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
exports.ResourceAccessAdminGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const require_admin_roles_decorator_1 = require("./require-admin-roles.decorator");
const options_1 = require("./options");
/** Simple role check for admin endpoints — no CASL dependency. */
let ResourceAccessAdminGuard = class ResourceAccessAdminGuard {
    constructor(reflector, options) {
        this.reflector = reflector;
        this.options = options;
    }
    canActivate(context) {
        const metadataRoles = this.reflector.getAllAndOverride(require_admin_roles_decorator_1.REQUIRE_ADMIN_ROLES_KEY, [context.getHandler(), context.getClass()]);
        // @RequireAdminRoles() with no args sets [] — treat as "use module defaults"
        const requiredRoles = metadataRoles && metadataRoles.length > 0
            ? metadataRoles
            : this.options.adminRoles;
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user?.id) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        if (!requiredRoles.includes(user.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        return true;
    }
};
exports.ResourceAccessAdminGuard = ResourceAccessAdminGuard;
exports.ResourceAccessAdminGuard = ResourceAccessAdminGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(options_1.RESOURCE_ACCESS_OPTIONS)),
    __metadata("design:paramtypes", [core_1.Reflector, Object])
], ResourceAccessAdminGuard);
