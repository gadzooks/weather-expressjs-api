import { removeNullValues, serializeWithoutNulls } from './jsonSerializer';

describe('JSON Serializer', () => {
  describe('removeNullValues', () => {
    it('should remove null values', () => {
      const result = removeNullValues('precip', null);
      expect(result).toBeUndefined();
    });

    it('should remove undefined values', () => {
      const result = removeNullValues('temp', undefined);
      expect(result).toBeUndefined();
    });

    it('should keep non-null values', () => {
      const result = removeNullValues('temp', 72);
      expect(result).toBe(72);
    });

    it('should remove empty arrays for specific fields', () => {
      expect(removeNullValues('stations', [])).toBeUndefined();
      expect(removeNullValues('preciptype', [])).toBeUndefined();
      expect(removeNullValues('alertIds', [])).toBeUndefined();
    });

    it('should keep empty arrays for other fields', () => {
      const result = removeNullValues('otherField', []);
      expect(result).toEqual([]);
    });

    it('should keep non-empty arrays', () => {
      const result = removeNullValues('stations', ['KSEA', 'KBFI']);
      expect(result).toEqual(['KSEA', 'KBFI']);
    });
  });

  describe('serializeWithoutNulls', () => {
    it('should serialize object without null values', () => {
      const obj = {
        temp: 72,
        precip: null,
        humidity: 65
      };

      const result = serializeWithoutNulls(obj);
      expect(result).toBe('{"temp":72,"humidity":65}');
    });

    it('should remove null and undefined values', () => {
      const obj = {
        temp: 72,
        precip: null,
        wind: undefined,
        conditions: 'Sunny'
      };

      const result = serializeWithoutNulls(obj);
      expect(result).toBe('{"temp":72,"conditions":"Sunny"}');
    });

    it('should remove empty arrays for specific fields', () => {
      const obj = {
        temp: 72,
        stations: [],
        preciptype: null,
        alertIds: []
      };

      const result = serializeWithoutNulls(obj);
      expect(result).toBe('{"temp":72}');
    });

    it('should keep non-empty arrays', () => {
      const obj = {
        temp: 72,
        stations: ['KSEA'],
        alertIds: ['alert1']
      };

      const result = serializeWithoutNulls(obj);
      expect(result).toBe(
        '{"temp":72,"stations":["KSEA"],"alertIds":["alert1"]}'
      );
    });

    it('should handle nested objects', () => {
      const obj = {
        location: {
          name: 'Seattle',
          coords: null
        },
        temp: 72,
        precip: null
      };

      const result = serializeWithoutNulls(obj);
      expect(result).toBe('{"location":{"name":"Seattle"},"temp":72}');
    });

    it('should preserve zero values', () => {
      const obj = {
        temp: 0,
        precip: 0,
        snow: null
      };

      const result = serializeWithoutNulls(obj);
      expect(result).toBe('{"temp":0,"precip":0}');
    });

    it('should preserve false values', () => {
      const obj = {
        isRaining: false,
        temp: null
      };

      const result = serializeWithoutNulls(obj);
      expect(result).toBe('{"isRaining":false}');
    });
  });
});
