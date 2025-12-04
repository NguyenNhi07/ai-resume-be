import { MomentInput as TimeInput } from 'moment';
import moment from 'moment-timezone';
import { ServerConfig } from '../config';

// no need to moment.tz.setDefault because it is already set in the server environment
const timezone = ServerConfig.get().TZ;
moment.tz.setDefault(timezone);

// @ts-ignore
moment.defaultFormat = 'YYYY-MM-DD HH:mm:ss';

export { moment as Time, TimeInput };
