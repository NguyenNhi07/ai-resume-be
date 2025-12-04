import { Prisma } from '@prisma/client';
import 'dotenv/config.js';
import { SYSTEM_REGEXS } from 'src/common/const/regex';
import SERVER_CONFIG_DEFAULT from '../../config/default-config';
import MAIN_CONFIG from '../../config/server-config';
import { ValidationError } from '../errors';
import { UnexpectedError } from '../errors/unexpected';
import { fs, path } from '../libs/file-system-manipulate';
import { Joi } from '../libs/joi';
import { _ } from '../libs/lodash';
import { NodeEnv } from '../platform';

/**
 * The `ServerConfig` class is a TypeScript class that is used to manage the server configuration in the application.
 * It is designed as a singleton, meaning it is instantiated only once throughout the application.
 *
 * @classdesc Provides a centralized way to manage and access the server configuration in the application.
 * It ensures that the configuration is validated and correctly initialized before it is used.
 */
export class ServerConfig {
  private static readonly config = this.initialize();
  private static packageJson: Record<string, any>;

  private constructor() {}

  public static get() {
    return this.config;
  }

  public static getPackageJson() {
    return this.packageJson;
  }

  public static getRedisCredentials() {
    return {
      host: ServerConfig.get().REDIS_HOST,
      port: ServerConfig.get().REDIS_PORT,
      password: ServerConfig.get().REDIS_PASSWORD,
    };
  }

  public static isLocalEnv() {
    return this.config.NODE_ENV === NodeEnv.Local;
  }

  public static isProductionEnv() {
    return this.config.NODE_ENV === NodeEnv.Production;
  }

  public static getDatabaseCredentials() {
    const { DATABASE_URL } = this.config;
    const matches = DATABASE_URL.match(SYSTEM_REGEXS.PRISMA_DATABASE_URL);
    const user = matches[1];
    const password = matches[2];
    const host = matches[3];
    const port = matches[4];
    const database = matches[5];
    return { user, password, host, port, database };
  }

  public static getPrismaLogLevel(): Prisma.LogLevel[] {
    const { PRISMA_LOG_LEVEL } = this.config;
    return Array.isArray(PRISMA_LOG_LEVEL)
      ? (PRISMA_LOG_LEVEL as any)
      : [PRISMA_LOG_LEVEL];
  }

  /**
   * ============================== Private methods ==============================<br>
   * Initializes the configuration by validating environment variables,
   * reading the package.json file, and merging the server and default configurations.
   **/
  private static initialize() {
    this.validateEnvironmentVariables();
    this.dontAllowArrayContainObject();
    this.readPackageJsonFile();
    // extra config
    const extraConfig = {
      APP_VERSION: this.packageJson?.version,
      APP_NAME: _.startCase(this.packageJson?.name),
    };
    const config = _.cloneDeep({ ...MAIN_CONFIG, ...extraConfig });
    this.convertStringToArray(config);
    return _.assignWith(config, SERVER_CONFIG_DEFAULT, ServerConfig.assignCustomizer);
  }

  private static validateEnvironmentVariables() {
    const configSchema = Joi.object({
      NODE_ENV: Joi.string()
        .required()
        .valid(...Object.values(NodeEnv)),
      DATABASE_URL: Joi.string().required(),
    }).unknown();
    const { error } = configSchema.validate(process.env);
    if (error) {
      throw new ValidationError(`Validate environment variable fail`, error.details);
    }
  }

  /**
   * Customizer function for the `_.assignWith` method from lodash.
   * This function is used to merge the default server configuration with the server configuration.
   * It ensures that the server configuration does not have any missing keys that are present in the default configuration.
   * It also ensures that the server configuration does not have any object values where the default configuration has scalar values.
   *
   * @example
   * const defaultConfig = { a: 1, b: 2, c: { d: 3 } };
   * const serverConfig = { a: 4, b: 5, c: 6 };
   * const mergedConfig = _.assignWith(serverConfig, defaultConfig, ServerConfig.assignCustomizer);
   * mergedConfig => { a: 4, b: 5, c: 6 }
   **/
  private static assignCustomizer(
    objValue: any,
    srcValue: any,
    key?: string,
    obj?: {},
    _source?: {},
  ) {
    if (!obj.hasOwnProperty(key)) {
      throw new UnexpectedError(
        `Mis-config because DEFAULT_SERVER_CONFIG have key="${key}" but MAIN_CONFIG doesn't`,
        `ServerConfig.initialize.assignCustomizer`,
      );
    }
    if (_.isPlainObject(objValue)) {
      return _.assignWith(objValue, srcValue, ServerConfig.assignCustomizer);
    }
    if (_.isPlainObject(srcValue)) {
      throw new UnexpectedError(
        `The MAIN_CONFIG stop at key="${key}" but DEFAULT_SERVER_CONFIG.${key} is object which is not make sense`,
        `ServerConfig.initialize.assignCustomizer`,
      );
    }
    return _.isNil(objValue) || _.isNaN(objValue) ? srcValue : objValue;
  }

  private static readPackageJsonFile() {
    const filepath = path.join('package.json');
    this.packageJson = fs.readJsonSync(filepath);
  }

  private static dontAllowArrayContainObject() {
    _.forIn(SERVER_CONFIG_DEFAULT, (value, key) => {
      if (Array.isArray(value) && _.some(value, _.isObject)) {
        throw new UnexpectedError(
          `Key ${key} in MAIN_CONFIG is an array containing an object`,
        );
      }
    });
  }

  private static convertStringToArray<T>(config: T) {
    _.forIn(config, (value, key) => {
      if (_.isString(value) && _.includes(value, ',')) {
        config[key] = value.split(',');
      }
    });
  }
}
