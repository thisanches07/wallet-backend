export interface IDataProvider {
  getName(): string;
  isAvailable(): boolean;
}

export abstract class BaseDataProvider implements IDataProvider {
  abstract getName(): string;

  isAvailable(): boolean {
    return true; // Override in implementations to check API keys, etc.
  }

  protected handleError(error: any, fallbackData?: any): any {
    console.warn(`${this.getName()} provider error:`, error.message);
    return fallbackData || null;
  }
}
