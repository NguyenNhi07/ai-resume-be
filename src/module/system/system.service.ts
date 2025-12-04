import { DiscoveredClass, DiscoveryService } from '@golevelup/nestjs-discovery';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { UserRole } from '@prisma/client';
import { RBAC_METADATA_KEY } from 'src/decorator';

@Injectable()
export class SystemService {
  public endpointCount = 0;

  constructor(
    private readonly reflector: Reflector,
    private readonly discoveryService: DiscoveryService,
  ) {}

  async injectCustomMetadataToSwaggerEndpoints(): Promise<void> {
    const controllers = await this.discoveryService.controllers(() => true);
    for (const controller of controllers) {
      this.injectRoleToSwaggerEndpoints(controller);
    }
  }

  private injectRoleToSwaggerEndpoints(controller: DiscoveredClass) {
    const methods = this.discoveryService.classMethodsWithMetaAtKey<any>(
      controller,
      DECORATORS.API_OPERATION,
    );
    this.endpointCount += methods.length;
    for (const method of methods) {
      const methodHandler = method.discoveredMethod.handler;
      const controllerHandler = controller.injectType;
      // const isHaveMethod = Reflect.getMetadata(`method`, methodHandler);
      const userRoles = this.reflector.getAllAndOverride<UserRole[]>(RBAC_METADATA_KEY, [
        methodHandler,
        controllerHandler,
      ]);
      const newDescription = `**Description**: ${
        method.meta.description || 'No Description'
      }<br/><br/>
          **Api Roles**: ${userRoles}
        `;
      const newSummary = `${method.meta.summary || ''} for ${userRoles}`;
      Reflect.defineMetadata(
        DECORATORS.API_OPERATION,
        {
          ...method.meta,
          description: newDescription,
          summary: newSummary,
        },
        methodHandler,
      );
    }
  }
}
