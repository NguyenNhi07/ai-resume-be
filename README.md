# Project Overview

Coming soon

## How to run and deploy

```shell
docker compose up -d database # start docker
# Take the .env from developers
yarn install
yarn db # select local
yarn start:dev
```

```shell
yarn deploy  # most of the time it works
```

## Rules, Regulations and Recommendations

### How to write good Module

- Use `yarn nestjs` to create modules
- **OperationId** is important and should be used as the name of the method
- Use @PropertyDto() for each property in the dto
- Nested module is not over 2 level
- Generated module is not imported by default, so you have to import it manually to the module you want to use
- Should create `.enum.ts`, `.const.ts`, `.type.ts`, ...

### Decorator: @PropertyDto()

1. Always use @PropertyDto() for all endpoints
2. Only use other nestjs decorators when you need to implement **validation in advance**
3. For ResponseDto use **@PropertyDto()** is good _except_ for structure = 'dto'
4. BodyDto and QueryDto must specify **@PropertyDto({type, required, validated})**

### Decorator: @SwaggerApiDocument()

1. Always use @SwaggerApiDocument() for all endpoints
2. Only use other nestjs decorators when you need to implement something special
3. **Must** specify `operation.operationId` option (Must be **unique** in the whole project)
4. Mark `response.isPagination = true` when api is getList

### How to write good Dto

- **Use `yarn nestjs` to create dto**, especially with DTO based on database schema

#### If you want to manually create a new Dto, please follow these rules:

1. There are 3 dto type which usually in use:
    - **ResponseDto** for response
    - **BodyDto** for @Body()
    - **QueryDto** for @Query()
2. DtoName = ```OperationId + Response/Body/Query + Dto```
    - Sample: OperationId = CreateUser
    - Response: CreateUserResponseDto
    - @Body: CreateUserBodyDto
    - @Query: CreateUserQueryDto
3. Set decorator for each property using **@PropertyDto()**
4. Endpoint dto order: Get -> Create -> Update -> otherwise
5. `*.dto.ts` file contain dtos for 1 database schema.
    - modules/user/dtos/index.ts => Contain all dtos for user module
    - modules/user/dtos/profile.dto.ts => Contain Profile dtos related to user
6. Extend by corresponding Dto Type
    - Response should extend Response
    - Body should be extended by Body
    - e.g.GetCourseResponseDto extends CreateCourseResponseDto
7. Separate dto by ```// *** operationId *** ``` for better look

### How to use migrate database

```shell
yarn db # prisma-migrate.ts
```

- Select **LOCAL** when DATABASE_URL point to local database
- Select **DEV** when DATABASE_URL point to dev database
    - You must use this command to create migration file
    - You should be careful when using this command (it might delete all data in the database)
    - Contact leader if the command asked about **data loss**
    - 1 PR should only have 1 migration, mean 1 time migration in dev

### Code style

- [StyleGuide and Coding Conventions](https://github.com/basarat/typescript-book/blob/master/docs/styleguide/styleguide.md) (
  An unofficial TypeScript StyleGuide)

### Environment variables

- Use `,` to separate multiple values in the same environment variable (array)
- .env file can be used to set up Docker image by docker-compose.yml

### Draw Entity-Relationship Diagrams, Painlessly 😎

1. Visit: https://dbdiagram.io/d
2. Import prisma/dbml/schema.dbml file
3. Enjoy

## Project special features and tools

#### How to generate admin

```shell
yarn genadmin -e admin@sotatek.com -p Sota@001
```

## How to debug

Webstorm node param:

```
 -r ts-node/register -r tsconfig-paths/register --trace-warnings
```

Vscode config:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug",
      "skipFiles": [
        "<node_internals>/**"
      ],
      "runtimeArgs": [
        "-r",
        "ts-node/register",
        "-r",
        "tsconfig-paths/register",
        "--trace-warnings"
      ],
      "args": [
        "${workspaceFolder}/src/main.ts"
      ],
      "sourceMaps": true,
      "cwd": "${workspaceFolder}",
      "protocol": "inspector"
    }
  ]
}
```

## Database and Prisma Guide

- **You should use `yarn db` to manipulate with database for better usage.**

#### Understand prisma migrate commands

| Command (prisma) | Environments    | Description                                                                      |
|------------------|-----------------|----------------------------------------------------------------------------------|
| `migrate dev`    | ALL except prod | Creates and applies a new migration                                              |
| `migrate reset`  | Dev             | Resets the database and reapplies all migrations. Useful for <b>Development</b>. |
| `migrate deploy` | Prod            | Applies all pending migrations in <b>Production</b>.                             |
| `db push`        | Local           | Updates the database without creating a migration file. Use in <b>Local</b>.     |
| `migrate status` | ALL             | Shows the migration status (pending/applied migrations).                         |

## Importing in this project

### Barrel Files Import

1. Barrel files should not be used when importing files within the same directory

```typescript
import {DatabaseService} from './database.service';
// not this
import {DatabaseService} from 'src/modules/base/database';
```

2. Otherwise, use alias path

```typescript
import {ServerException} from 'src/exceptions';
// not this
import {ServerException} from '../../../../exceptions';
```

### Solve Circular dependency

```typescript
// both sides of the relationship can use @Inject() and the forwardRef()
@Inject(forwardRef(() => CommonService))
@Inject(forwardRef(() => CatsService))
```
