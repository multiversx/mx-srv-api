import { Injectable } from "@nestjs/common";
import { PerformanceProfiler } from "src/utils/performance.profiler";
import { LocalCacheValue } from "./entities/local.cache.value";

@Injectable()
export class LocalCacheService {
  private static dictionary: { [ key: string ]: LocalCacheValue } = {};

  private lastPruneTime: number = new Date().getTime();

  getDictionary() {
    return LocalCacheService.dictionary;
  }

  setCacheValue<T>(key: string, value: T, ttl: number): T {
    if (this.needsPrune()) {
      this.prune();
    }

    let expires = new Date().getTime() + (ttl * 1000);

    LocalCacheService.dictionary[key] = {
      value,
      expires
    };

    return value;
  }

  getCacheValue<T>(key: string): T | undefined {
    let dictionary = this.getDictionary();

    let cacheValue = dictionary[key];
    if (!cacheValue) {
      return undefined;
    }

    let now = new Date().getTime();
    if (cacheValue.expires < now) {
      delete dictionary[key];
      return undefined;
    }

      return cacheValue.value;
  }

  deleteCacheKey(key: string) {
    let dictionary = this.getDictionary();

    delete dictionary[key];
  }

  needsPrune() {
    return new Date().getTime() > this.lastPruneTime + 60000;
  }

  prune() {
    let dictionary = this.getDictionary();

    let now = new Date().getTime();
    this.lastPruneTime = now;

    let profiler = new PerformanceProfiler();

    let keys = Object.keys(dictionary);

    for (let key of keys) {
      let value = dictionary[key];
      if (value.expires < now) {
        delete dictionary[key];
      }
    }

    let keysAfter = Object.keys(dictionary);

    profiler.stop(`Local cache prune. Deleted ${keys.length - keysAfter.length} keys. Total keys in cache: ${keysAfter.length}`, true);
  }
}