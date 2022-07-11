import { IsOptional } from "class-validator";
import { SettingsServiceEnum } from "../entities/setting.entity";

export class SettingListQueryDto {
  @IsOptional()
  settingService: SettingsServiceEnum;
}