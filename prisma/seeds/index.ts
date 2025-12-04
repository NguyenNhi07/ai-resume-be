import {ServerConfig} from '@server/config';
import 'dotenv/config.js';

(async function seed() {
  if (!ServerConfig.isProductionEnv()) {
  }
})();
