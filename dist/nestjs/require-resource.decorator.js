"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireResource = exports.REQUIRE_RESOURCE_KEY = void 0;
const common_1 = require("@nestjs/common");
const resource_access_guard_1 = require("./resource-access.guard");
Object.defineProperty(exports, "REQUIRE_RESOURCE_KEY", { enumerable: true, get: function () { return resource_access_guard_1.REQUIRE_RESOURCE_KEY; } });
/**
 * RBAC v2 — require catalogue resource access (same rules as UI `<CanAccess>`).
 */
const RequireResource = (resourceId) => (0, common_1.SetMetadata)(resource_access_guard_1.REQUIRE_RESOURCE_KEY, resourceId);
exports.RequireResource = RequireResource;
