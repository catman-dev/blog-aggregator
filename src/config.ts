import fs from "fs";
import os from "os";
import path from "path";

type RawConfig = {
  db_url: string;
  current_user_name?: string;
};

export type Config = {
  dbUrl: string;
  currentUserName?: string;
};

function getConfigFilePath(): string {
  return path.join(os.homedir(), ".gatorconfig.json");
}

function writeConfig(cfg: Config): void {
  const rawConfig: RawConfig = {
    db_url: cfg.dbUrl,
  };

  if (cfg.currentUserName !== undefined) {
    rawConfig.current_user_name = cfg.currentUserName;
  }

  fs.writeFileSync(getConfigFilePath(), JSON.stringify(rawConfig, null, 2));
}

function validateConfig(rawConfig: any): Config {
  if (typeof rawConfig !== "object" || rawConfig === null) {
    throw new Error("invalid config file");
  }

  if (typeof rawConfig.db_url !== "string") {
    throw new Error("config must include db_url");
  }

  if (
    rawConfig.current_user_name !== undefined &&
    typeof rawConfig.current_user_name !== "string"
  ) {
    throw new Error("current_user_name must be a string");
  }

  return {
    dbUrl: rawConfig.db_url,
    currentUserName: rawConfig.current_user_name,
  };
}

export function readConfig(): Config {
  const configFile = getConfigFilePath();
  const fileContents = fs.readFileSync(configFile, "utf-8");
  const parsed = JSON.parse(fileContents);
  return validateConfig(parsed);
}

export function setUser(userName: string): void {
  const currentConfig = readConfig();
  currentConfig.currentUserName = userName;
  writeConfig(currentConfig);
}
