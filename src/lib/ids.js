import { ObjectId } from 'mongodb';

export function isStrictObjectId(value) {
    if (typeof value !== 'string') return false;
    if (!ObjectId.isValid(value)) return false;
    return String(new ObjectId(value)) === value;
}

export function toObjectId(value) {
    return isStrictObjectId(value) ? new ObjectId(value) : null;
}

export function coerceUserId(value) {
    const objId = toObjectId(value);
    return objId || value;
}

export function coerceNumberId(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && /^[0-9]+$/.test(value)) return parseInt(value, 10);
    return value;
}

export function coerceNumberOrObjectId(value) {
    const numberId = coerceNumberId(value);
    if (typeof numberId === 'number' && Number.isFinite(numberId)) return numberId;
    const objId = toObjectId(value);
    return objId || value;
}

export function serializeId(value) {
    if (
        value &&
        typeof value === 'object' &&
        value._bsontype === 'ObjectId' &&
        typeof value.toHexString === 'function'
    ) {
        return value.toHexString();
    }
    return value;
}
