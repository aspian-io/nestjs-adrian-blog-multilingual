export enum PermissionsEnum {
  // ADMIN
  ADMIN = "rw_a",

  // USERS
  USER_READ = "usr_r",
  USER_CREATE = "usr_w",
  USER_EDIT = "usr_w+",
  USER_DELETE = "usr_d",
  // SETTINGS
  SETTING_READ = "setting_r",
  SETTING_EDIT = "setting_w+",
  // LANGS
  LANG_READ = "lng_r",
  LANG_CREATE = "lng_w",
  LANG_EDIT = "lng_w+",
  LANG_DELETE = "lng_d",
  // FILES
  FILE_READ = "file_r",
  FILE_CREATE = "file_w",
  FILE_EDIT = "file_w+",
  FILE_DELETE = "file_d",
}