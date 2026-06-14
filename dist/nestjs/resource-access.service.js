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
exports.ResourceAccessService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const catalogue_1 = require("../core/catalogue");
const resolve_access_1 = require("../core/resolve-access");
const user_resource_override_entity_1 = require("./entity/user-resource-override.entity");
const options_1 = require("./options");
let ResourceAccessService = class ResourceAccessService {
    constructor(options, overrideRepository, userRepository) {
        this.options = options;
        this.overrideRepository = overrideRepository;
        this.userRepository = userRepository;
    }
    getCatalogue() {
        return { tree: this.options.catalogue.tree };
    }
    async getUserResourceAccess(userId) {
        const user = await this.findUser(userId);
        const overrides = await this.loadOverrideMap(userId);
        const tree = (0, catalogue_1.getCatalogueForRole)(user.role, this.options.catalogue);
        const flat = (0, catalogue_1.flattenResourceTree)(tree);
        const nodes = flat.map((node) => (0, resolve_access_1.buildNodeState)(user.role, node, overrides, this.options.catalogue, this.options.godModeRoles));
        return {
            user: { id: user.id, email: user.email, role: user.role },
            tree,
            nodes,
            allowed_resource_ids: nodes.filter((n) => n.effective).map((n) => n.id),
        };
    }
    async getMyResourceAccess(userId) {
        const { allowed_resource_ids } = await this.getUserResourceAccess(userId);
        return { allowed_resource_ids };
    }
    canAccess(role, resourceId, overrides) {
        return (0, resolve_access_1.canAccessResource)(role, resourceId, overrides, this.options.catalogue, this.options.godModeRoles);
    }
    async canAccessResourceForUser(userId, resourceId) {
        const user = await this.findUser(userId);
        const overrides = await this.loadOverrideMap(userId);
        return this.canAccess(user.role, resourceId, overrides);
    }
    async batchUpdateOverrides(userId, items) {
        const user = await this.findUser(userId);
        this.assertResourceAccessEditable(user);
        for (const item of items) {
            if (item.effect === null) {
                await this.overrideRepository.delete({
                    user_id: userId,
                    resource_id: item.resource_id,
                });
                continue;
            }
            await this.overrideRepository.upsert({
                user_id: userId,
                resource_id: item.resource_id,
                effect: item.effect,
            }, ['user_id', 'resource_id']);
        }
        return this.getUserResourceAccess(userId);
    }
    async toggleResourceAccess(userId, resourceId, allowed) {
        const user = await this.findUser(userId);
        this.assertResourceAccessEditable(user);
        const overrides = await this.loadOverrideMap(userId);
        const roleWouldGrant = (0, resolve_access_1.roleDefaultAllows)(user.role, resourceId, this.options.catalogue, this.options.godModeRoles);
        let effect;
        if (allowed) {
            effect = roleWouldGrant ? null : user_resource_override_entity_1.ResourceOverrideEffect.ALLOW;
        }
        else {
            effect = user_resource_override_entity_1.ResourceOverrideEffect.DENY;
        }
        return this.batchUpdateOverrides(userId, [{ resource_id: resourceId, effect }]);
    }
    assertResourceAccessEditable(user) {
        if (this.options.godModeRoles.includes(user.role)) {
            throw new common_1.BadRequestException(`Resource access overrides do not apply to ${user.role} users`);
        }
    }
    async findUser(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'email', 'role', 'is_deleted'],
        });
        if (!user || user.is_deleted) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async loadOverrideMap(userId) {
        const rows = await this.overrideRepository.find({ where: { user_id: userId } });
        return new Map(rows.map((r) => [r.resource_id, r.effect]));
    }
};
exports.ResourceAccessService = ResourceAccessService;
exports.ResourceAccessService = ResourceAccessService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(options_1.RESOURCE_ACCESS_OPTIONS)),
    __metadata("design:paramtypes", [Object, typeorm_1.Repository,
        typeorm_1.Repository])
], ResourceAccessService);
