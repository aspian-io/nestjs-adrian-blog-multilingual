import { ConfigService } from "@nestjs/config";
import { SettingsKeyEnum, SettingsServiceEnum } from "src/settings/entities/setting.entity";

export const settingsData = ( configService: ConfigService ) => [
  {
    key: SettingsKeyEnum.TRANSLATION_MULTILINGUAL,
    value: configService.get( 'MULTILINGUAL_ENABLED' ),
    service: SettingsServiceEnum.LANGS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.TRANSLATION_DEFAULT_LANG,
    value: "0",
    service: SettingsServiceEnum.LANGS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.SMS_PROVIDER,
    value: configService.get( 'SMS_PROVIDER' ),
    service: SettingsServiceEnum.SMS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.SMS_ORIGINATOR,
    value: configService.get( 'SMS_ORIGINATOR' ),
    service: SettingsServiceEnum.SMS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.SMS_API_KEY,
    value: configService.get( 'SMS_API_KEY' ),
    service: SettingsServiceEnum.SMS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.SMS_BIRTHDAY_CONGRATS,
    value: "false",
    service: SettingsServiceEnum.SMS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.SMS_BIRTHDAY_CONGRATS_TIME,
    value: "12",
    service: SettingsServiceEnum.SMS,
    userAgent: "SYSTEM"
  },

  {
    key: SettingsKeyEnum.EMAIL_NEWSLETTER_SEND,
    value: "false",
    service: SettingsServiceEnum.EMAIL,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.EMAIL_NEWSLETTER_SEND_TIME,
    value: "18",
    service: SettingsServiceEnum.EMAIL,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.EMAIL_NEWSLETTER_HEADER,
    value: "false",
    service: SettingsServiceEnum.EMAIL,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.EMAIL_NEWSLETTER_BODY,
    value: "false",
    service: SettingsServiceEnum.EMAIL,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.EMAIL_NEWSLETTER_FOOTER,
    value: "false",
    service: SettingsServiceEnum.EMAIL,
    userAgent: "SYSTEM"
  },

  {
    key: SettingsKeyEnum.COMMENT_IS_APPROVED,
    value: "true",
    service: SettingsServiceEnum.POST_COMMENTS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.COMMENT_FORBIDDEN_EXPRESSIONS,
    value: "forbidden_1,forbidden_2,forbidden_3,forbidden_4",
    service: SettingsServiceEnum.POST_COMMENTS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.COMMENT_FORBIDDEN_SUSPEND,
    value: "true",
    service: SettingsServiceEnum.POST_COMMENTS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.ATTACHMENT_URL_EXP_HOURS,
    value: "24",
    service: SettingsServiceEnum.ATTACHMENTS,
    userAgent: "SYSTEM"
  },
];