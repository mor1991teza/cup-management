export {};

declare global {
  interface Window {
    appPaths: {
      getResources: () => Promise<string>;
      saveLicenseToDisk?: (licenseData: any) => Promise<boolean>;
      readLicenseFromDisk?: () => Promise<any>;
    };
  }
}