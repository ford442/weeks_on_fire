import { cartoonRecords } from './generated/cartoons';

export type { CartoonRecord, CartoonStatus } from './types';
export { cartoonStatusMeta } from './types';

export const cartoons = cartoonRecords;
