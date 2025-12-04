import { confirm, input, select } from '@inquirer/prompts';
import { ValidationError } from '@server/errors';
import { fs } from '@server/libs/file-system-manipulate';
import { _ } from '@server/libs/lodash';
import { ensureDirectoryExists } from 'src/common/helpers/file-system';
import { TypescriptParser } from 'typescript-parser';
import { PropertyDeclaration } from 'typescript-parser/declarations/PropertyDeclaration';

class GenerateNestjsResource {
  private readonly options: Record<string, any> = {};
  private readonly USER_SELECT = {
    CompleteModule: 'GenerateCompleteModule',
    EmptyModule: 'EmptyModule',
    Dto: 'Dto',
  };
  private readonly parser = new TypescriptParser();
  private prismaImport: any = [];
  private prismaEnums: string[] = [];
  private modelProperties: PropertyDeclaration[] = [];

  async run() {
    try {
      await this.parseOptions();
      // prepare
      await this.prepare();
      // write
      const promises = [];
      switch (this.options.userSelect) {
        case this.USER_SELECT.CompleteModule:
          return Promise.all([
            this.writeModuleFile(),
            this.writeServiceFile(),
            this.writeControllerFile(),
            this.writeDtosDirectory(),
            this.writeModuleIndexFile(),
          ]);
        case this.USER_SELECT.EmptyModule:
          return Promise.all([
            this.writeModuleFile(),
            this.writeServiceFile(),
            this.writeControllerFile(),
            this.writeModuleIndexFile(),
          ]);
        case this.USER_SELECT.Dto:
          return this.writeDtosDirectory();
        default:
      }
    } catch (error) {
      await fs.rmdir(this.options.modulePath);
    }
  }

  private async prepare() {
    const prismaDtoFilepath = `prisma/dtos/${this.options.modelFilename}.ts`;
    const isExist = fs.existsSync(prismaDtoFilepath);
    if (!isExist) {
      return;
    }
    const parse: any = await this.parser.parseFile(prismaDtoFilepath, '.');
    this.modelProperties = parse.declarations[0].properties.filter(
      (property: any) => !['isDeleted', 'updatedAt'].includes(property.name),
    );
    this.prismaImport = parse.imports[1]?.specifiers;
    this.prismaEnums = parse.imports[1]?.specifiers.map((e: any) => e.specifier);
  }

  private async parseOptions() {
    const userSelect = await select({
      message: `What do you want to generate?`,
      choices: [
        {
          name: 'Complete module',
          value: this.USER_SELECT.CompleteModule,
          description: `Generate module, service, controller with CRUD operations`,
        },
        {
          name: 'Empty module',
          value: this.USER_SELECT.EmptyModule,
          description: `Generate module, service, controller with empty content`,
        },
        {
          name: 'Dtos only',
          value: this.USER_SELECT.Dto,
          description: `Generate module dtos based on schema.prisma`,
        },
      ],
    });
    Object.assign(this.options, { userSelect });

    switch (userSelect) {
      case this.USER_SELECT.CompleteModule:
        await this.parseModuleName();
        await this.parseModulePath();
        await this.parseModelName();
        break;
      case this.USER_SELECT.EmptyModule:
        await this.parseModuleName();
        await this.parseModulePath();
        break;
      case this.USER_SELECT.Dto:
        await this.parseModelName();
        await this.parseModuleName();
        await this.parseModulePath();
        break;
    }
  }

  private async parseModuleName() {
    const moduleName = await input({
      message: 'Enter module name',
      required: true,
    });
    Object.assign(this.options, {
      moduleName: _.upperFirst(_.camelCase(moduleName)),
      moduleNameKebab: _.kebabCase(moduleName),
      moduleNameKebabUnderscore: _.kebabCase(moduleName).replace(/-/g, '_'),
    });
  }

  private async parseModulePath(useNameAsPath: boolean = true) {
    let modulePath: string;

    if (useNameAsPath) {
      const nameKebab = this.options.moduleNameKebab;
      modulePath = `src/module/${nameKebab}`;
      const isUseDefaultPath = await confirm({
        message: `Do you want to use default module path ${modulePath}`,
        default: true,
      });
      if (isUseDefaultPath) {
        await ensureDirectoryExists(modulePath);
        Object.assign(this.options, { modulePath });
        return;
      }
    }
    const path = await input({
      message: 'Enter module path which is relative from src/modules',
      required: true,
    });
    modulePath = `src/module/${path}`;
    await ensureDirectoryExists(modulePath);
    Object.assign(this.options, { modulePath });
  }

  private async parseModelName() {
    const modelName = await input({
      message: 'Enter Prisma model for this module (take from schema.prisma)',
      required: true,
    });
    await fs.readFile('prisma/schema.prisma').then((data) => {
      const isMatch = data.toString().match(`model ${modelName} {`);
      if (!isMatch) {
        throw new ValidationError(`Model ${modelName} not found in schema.prisma`);
      }
    });
    Object.assign(this.options, {
      modelName,
      modelNameCamel: _.camelCase(modelName),
      modelFilename: _.kebabCase(modelName).replace(/-/g, '_'),
    });
  }

  private writeModuleFile() {
    const nameKebab = this.options.moduleNameKebab;
    return fs.writeFile(
      `${this.options.modulePath}/${nameKebab}.module.ts`,
      this.getModuleContent(),
    );
  }

  private writeServiceFile() {
    const nameKebab = this.options.moduleNameKebab;

    if (this.options.userSelect === this.USER_SELECT.EmptyModule) {
      const content = this.getEmptyServiceContent();
      return fs.writeFile(`${this.options.modulePath}/${nameKebab}.service.ts`, content);
    }

    const normalProperties = [];
    const dateProperties = [];
    for (const property of this.modelProperties) {
      if (property.type === 'Date') {
        dateProperties.push(property);
      } else {
        normalProperties.push(property);
      }
    }
    const normalFilter = normalProperties
      .map((prop) => {
        return `      ...(query.${prop.name} && { ${prop.name}: query.${prop.name} }),`;
      })
      .join('\n');
    const dateFilter = dateProperties
      .map((prop) => {
        return `    if (query.${prop.name}RangeStart || query.${prop.name}RangeEnd) {
      where.${prop.name} = {
        gte: query.${prop.name}RangeStart,
        lte: query.${prop.name}RangeEnd,
      };
    }`;
      })
      .join('\n');

    const content = this.getCompleteServiceContent(normalFilter, dateFilter);
    return fs.writeFile(`${this.options.modulePath}/${nameKebab}.service.ts`, content);
  }

  private writeControllerFile() {
    const nameKebab = this.options.moduleNameKebab;
    const content =
      this.options.userSelect === this.USER_SELECT.EmptyModule
        ? this.getEmptyControllerContent()
        : this.getCompleteControllerContent();
    return fs.writeFile(`${this.options.modulePath}/${nameKebab}.controller.ts`, content);
  }

  private async writeDtosDirectory() {
    await ensureDirectoryExists(`${this.options.modulePath}/dtos`);

    if (this.options.userSelect === this.USER_SELECT.EmptyModule) {
      return fs.writeFile(`${this.options.modulePath}/dtos/index.ts`, '');
    }

    const responseProperties = this.modelProperties
      .map((prop) => this.makePropertyDto(prop, 'response'))
      .join('\n');

    const bodyProperties = this.modelProperties
      .filter((prop) => !['id', 'createdAt'].includes(prop.name))
      .map((prop) => this.makePropertyDto(prop, 'body'))
      .join('\n');

    const queryProp = this.getQueryProperties(this.modelProperties).map((prop) =>
      this.makePropertyDto(prop, 'query'),
    );
    const queryProperties = this.addQueryOrderByProperty(queryProp).join('\n');

    const specifiers = this.prismaImport?.map((e: any) => e.specifier);
    let importContent = ``;
    if (specifiers) {
      importContent = `import { ${specifiers.join(', ')} } from '@prisma/client';`;
    }

    return fs.writeFile(
      `${this.options.modulePath}/dtos/index.ts`,
      this.getDtoContent(
        responseProperties,
        queryProperties,
        bodyProperties,
        importContent,
      ),
    );
  }

  private addQueryOrderByProperty(queryProp: string[]) {
    const modelName = this.options.modelName;
    queryProp.push(`
  @MultipleOrderBy(DatabaseModelFields.${modelName})
  orderBy: string[];
  `);
    return queryProp;
  }

  private writeModuleIndexFile() {
    return fs.writeFile(
      `${this.options.modulePath}/index.ts`,
      this.getModuleIndexFileContent(),
    );
  }

  /**
   * Transform model properties to query properties (add range for Date type)
   * */
  private getQueryProperties(properties: PropertyDeclaration[]) {
    const result: PropertyDeclaration[] = [];
    for (const property of properties) {
      if (property.type === 'Date') {
        result.push(
          { ...property, name: `${property.name}RangeStart` },
          { ...property, name: `${property.name}RangeEnd` },
        );
      } else {
        result.push(property);
      }
    }
    return result;
  }

  // ****************************** file content methods ******************************
  private getModuleIndexFileContent() {
    const nameKebab = this.options.moduleNameKebab;
    return `export * from './${nameKebab}.module';
export * from './${nameKebab}.controller';
export * from './${nameKebab}.service';
`;
  }

  private getModuleContent() {
    const name = this.options.moduleName;
    const nameKebab = this.options.moduleNameKebab;
    return `import { Module } from '@nestjs/common';
import { ${name}Controller } from './${nameKebab}.controller';
import { ${name}Service } from './${nameKebab}.service';

@Module({
  imports: [],
  controllers: [${name}Controller],
  providers: [${name}Service],
  exports: [${name}Service],
})
export class ${name}Module {}
`;
  }

  private getEmptyServiceContent(): string {
    const name = this.options.moduleName;
    return `import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/module/base/database';

@Injectable()
export class ${name}Service {
  constructor(private readonly databaseService: DatabaseService) {}
}
`;
  }

  private getEmptyControllerContent(): string {
    const name = this.options.moduleName;
    const nameKebab = this.options.moduleNameKebab;
    const tag = _.words(name).join(' ');
    const nameCamel = _.camelCase(this.options.moduleName);

    return `import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessRole } from 'src/common/enums';
import { RoleBaseAccessControl, SwaggerApiDocument } from 'src/decorator';
import { AuthGuard } from 'src/guard';
import { ${name}Service } from './${nameKebab}.service';

@Controller('${nameKebab}')
@ApiTags('${tag}')
@UseGuards(AuthGuard)
@RoleBaseAccessControl([])
@ApiBearerAuth()
export class ${name}Controller {
  constructor(private readonly ${nameCamel}Service: ${name}Service) {}
}
`;
  }

  private getCompleteControllerContent(): string {
    const name = this.options.moduleName;
    const nameCamel = _.camelCase(this.options.moduleName);
    const nameKebab = this.options.moduleNameKebab;
    const tag = _.words(name).join(' ');
    return `import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessRole } from 'src/common/enums';
import { PaginationResponseDto } from '@server/platform/dtos';
import { RoleBaseAccessControl, SwaggerApiDocument } from 'src/decorator';
import { AuthGuard } from 'src/guard';
import { ${name}Service } from './${nameKebab}.service';
import {
  Create${name}BodyDto,
  Create${name}ResponseDto,
  Get${name}DetailResponseDto,
  Get${name}ListQueryDto,
  Get${name}ListResponseDto,
  Update${name}BodyDto,
  Update${name}ResponseDto,
} from './dtos';

@Controller('${nameKebab}')
@ApiTags('${tag}')
@UseGuards(AuthGuard)
@RoleBaseAccessControl([])
@ApiBearerAuth()
export class ${name}Controller {
  constructor(private readonly ${nameCamel}Service: ${name}Service) {}

  @Post()
  @SwaggerApiDocument({
    response: { type: Create${name}ResponseDto },
    body: { type: Create${name}BodyDto, required: true },
    operation: {
      operationId: \`create${name}\`,
      summary: \`Api create${name}\`,
    },
  })
  async create${name}(
    @Body() body: Create${name}BodyDto,
  ): Promise<Create${name}ResponseDto> {
    return this.${nameCamel}Service.create${name}(body);
  }

  @Get()
  @SwaggerApiDocument({
    response: {
      type: Get${name}ListResponseDto,
      isPagination: true,
    },
    operation: {
      operationId: \`get${name}List\`,
      summary: \`Api get${name}List\`,
    },
  })
  async get${name}List(
    @Query() query: Get${name}ListQueryDto,
  ): Promise<PaginationResponseDto<Get${name}ListResponseDto>> {
    return this.${nameCamel}Service.get${name}List(query);
  }

  @Get(':id')
  @SwaggerApiDocument({
    response: { type: Get${name}DetailResponseDto },
    operation: {
      operationId: \`get${name}Detail\`,
      summary: \`Api get${name}Detail\`,
    },
  })
  async get${name}Detail(
    @Param('id') id: number,
  ): Promise<Get${name}DetailResponseDto> {
    return this.${nameCamel}Service.get${name}Detail(id);
  }

  @Put(':id')
  @SwaggerApiDocument({
    response: { type: Update${name}ResponseDto },
    body: { type: Update${name}BodyDto, required: true },
    operation: {
      operationId: \`update${name}\`,
      summary: \`Api update${name}\`,
    },
  })
  async update${name}(
    @Param('id') id: number,
    @Body() body: Update${name}BodyDto,
  ): Promise<Update${name}ResponseDto> {
    return this.${nameCamel}Service.update${name}(id, body);
  }

  @Delete(':id')
  @SwaggerApiDocument({
    response: { status: HttpStatus.NO_CONTENT },
    operation: {
      operationId: \`delete${name}\`,
      summary: \`Api delete${name}\`,
    },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete${name}(@Param('id') id: number): Promise<void> {
    await this.${nameCamel}Service.delete${name}(id);
  }
}
`;
  }

  private getCompleteServiceContent(normalFilter: string, dateFilter: string): string {
    const moduleName = this.options.moduleName;
    const modelCamel = this.options.modelNameCamel;
    const model = this.options.modelName;
    return `import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ERROR_RESPONSE } from 'src/common/const';
import { parseOrderByFromQuery } from 'src/common/helpers/database';
import { validatePaginationQueryDto } from 'src/common/helpers/request';
import { PaginationResponseDto } from '@server/platform/dtos';
import { ServerException } from 'src/exception';
import { DatabaseService } from 'src/module/base/database';
import {
  Create${moduleName}BodyDto,
  Create${moduleName}ResponseDto,
  Get${moduleName}DetailResponseDto,
  Get${moduleName}ListQueryDto,
  Get${moduleName}ListResponseDto,
  Update${moduleName}BodyDto,
  Update${moduleName}ResponseDto,
} from './dtos';

@Injectable()
export class ${moduleName}Service {
  constructor(private readonly databaseService: DatabaseService) {}

  async create${moduleName}(body: Create${moduleName}BodyDto): Promise<Create${moduleName}ResponseDto> {
    return this.databaseService.${modelCamel}.create({
      data: { ...body },
    });
  };

  async get${moduleName}List(query: Get${moduleName}ListQueryDto): Promise<PaginationResponseDto<Get${moduleName}ListResponseDto>> {
    const { page, pageSize, take, skip } = validatePaginationQueryDto(query);
    
    const where: Prisma.${model}WhereInput = {
${normalFilter}
    };
${dateFilter};

    const [data, total] = await Promise.all([
      this.databaseService.${modelCamel}.findMany({
        where,
        take,
        skip,
        orderBy: parseOrderByFromQuery(query.orderBy),
        ...(query.lastItemId && { cursor: { id: query.lastItemId } }),
      }),
      this.databaseService.${modelCamel}.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    return { data, pagination: { page, pageSize, total, totalPages } };
  }

  async get${moduleName}Detail(id: number): Promise<Get${moduleName}DetailResponseDto> {
    const ${modelCamel} = await this.databaseService.${modelCamel}.findFirst({ where: { id } });
    if (!${modelCamel}) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
    }
    return ${modelCamel};
  }

  async update${moduleName}(id: number, body: Update${moduleName}BodyDto): Promise<Update${moduleName}ResponseDto> {
    const ${modelCamel} = await this.databaseService.${modelCamel}.findFirst({ where: { id } });
    if (!${modelCamel}) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
    }
    return this.databaseService.${modelCamel}.update({
      where: { id },
      data: { ...body },
    });
  }

  async delete${moduleName}(id: number) {
    const ${modelCamel} = await this.databaseService.${modelCamel}.findFirst({ where: { id } });
    if (!${modelCamel}) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
    }
    return this.databaseService.${modelCamel}.delete({ where: { id } });
  }
}
`;
  }

  private makePropertyDto = (
    property: PropertyDeclaration,
    type: 'query' | 'response' | 'body',
  ) => {
    const structure = this.isEnum(property) ? `\n    structure: 'enum',` : '';
    switch (type) {
      case 'response':
        return `  @PropertyDto()\n  ${property.name}: ${property.type};\n`;
      case 'query':
        return `  @PropertyDto({
    type: ${_.upperFirst(_.camelCase(property.type))},
    required: false,
    validated: true,${structure}
  })
  ${property.name}: ${property.type};\n`;
      case 'body':
        return `  @PropertyDto({
    type: ${_.upperFirst(_.camelCase(property.type))},
    required: ${!property.isOptional},
    validated: true,${structure}
  })
  ${property.name}: ${property.type};\n`;
      default:
      // not supported yet
    }
  };

  private isEnum(property: PropertyDeclaration): boolean {
    return this.prismaEnums?.includes(property.type);
  }

  private getDtoContent = (
    responseProperties: string,
    queryProperties: string,
    bodyProperties: string,
    importContent: string = '',
  ) => {
    const name = this.options.moduleName;

    return `import { PartialType } from '@nestjs/swagger';
${importContent}
import { DatabaseModelFields } from '@server/libs/database';
import { PaginationQueryDto } from '@server/platform/dtos';
import { MultipleOrderBy, PropertyDto } from 'src/decorator';

// Auto generated by tools/generate-dtos.ts at ${new Date().toISOString()}
// ****************************** Base ${name} response dto ******************************
export class Base${name}ResponseDto {
${responseProperties}
}

// ****************************** GET ${name} dto ******************************
export class Get${name}DetailResponseDto extends Base${name}ResponseDto {
  // Add more fields if needed such as relations
}

export class Get${name}ListResponseDto extends Base${name}ResponseDto {
  // Add more fields if needed such as relations
}

export class Get${name}ListQueryDto extends PaginationQueryDto {
${queryProperties}
}

// ****************************** CREATE ${name} dto ******************************
// todo: delete this line if you have corrected the dto
export class Create${name}BodyDto {
${bodyProperties}
}

export class Create${name}ResponseDto extends Base${name}ResponseDto {}

// ****************************** UPDATE ${name} dto ******************************
// todo: delete this line if you have corrected the dto
export class Update${name}BodyDto extends PartialType(Create${name}BodyDto) {
  // User OmitType if needed
}

export class Update${name}ResponseDto extends Base${name}ResponseDto {}

// ****************************** More ${name} dto below ******************************
`;
  };
}

(async function bootstrap() {
  const command = new GenerateNestjsResource();
  return await command.run().catch((error) => {
    console.error(error, error.stack);
  });
})();
