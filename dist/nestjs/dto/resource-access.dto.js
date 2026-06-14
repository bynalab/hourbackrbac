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
exports.ToggleResourceAccessDto = exports.BatchResourceAccessDto = exports.BatchResourceAccessItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const user_resource_override_entity_1 = require("../entity/user-resource-override.entity");
class BatchResourceAccessItemDto {
}
exports.BatchResourceAccessItemDto = BatchResourceAccessItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'manufacturer.batches' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], BatchResourceAccessItemDto.prototype, "resource_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: user_resource_override_entity_1.ResourceOverrideEffect,
        nullable: true,
        description: 'null removes the override (revert to role default)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(user_resource_override_entity_1.ResourceOverrideEffect),
    __metadata("design:type", String)
], BatchResourceAccessItemDto.prototype, "effect", void 0);
class BatchResourceAccessDto {
}
exports.BatchResourceAccessDto = BatchResourceAccessDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BatchResourceAccessItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BatchResourceAccessItemDto),
    __metadata("design:type", Array)
], BatchResourceAccessDto.prototype, "items", void 0);
class ToggleResourceAccessDto {
}
exports.ToggleResourceAccessDto = ToggleResourceAccessDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'manufacturer.batches' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], ToggleResourceAccessDto.prototype, "resource_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'true = allow, false = deny override' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ToggleResourceAccessDto.prototype, "allowed", void 0);
