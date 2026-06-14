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
exports.UserResourceOverride = exports.ResourceOverrideEffect = void 0;
const typeorm_1 = require("typeorm");
var ResourceOverrideEffect;
(function (ResourceOverrideEffect) {
    ResourceOverrideEffect["ALLOW"] = "allow";
    ResourceOverrideEffect["DENY"] = "deny";
})(ResourceOverrideEffect || (exports.ResourceOverrideEffect = ResourceOverrideEffect = {}));
let UserResourceOverride = class UserResourceOverride {
};
exports.UserResourceOverride = UserResourceOverride;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserResourceOverride.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], UserResourceOverride.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resource_id', length: 128 }),
    __metadata("design:type", String)
], UserResourceOverride.prototype, "resource_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 8 }),
    __metadata("design:type", String)
], UserResourceOverride.prototype, "effect", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], UserResourceOverride.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], UserResourceOverride.prototype, "updated_at", void 0);
exports.UserResourceOverride = UserResourceOverride = __decorate([
    (0, typeorm_1.Entity)('user_resource_overrides'),
    (0, typeorm_1.Unique)(['user_id', 'resource_id'])
], UserResourceOverride);
