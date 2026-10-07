// Replaced at build time; source-level protocol tests do not need a release tag.
declare const __MYISSUE_VERSION__: string;
export const version = typeof __MYISSUE_VERSION__ === 'undefined' ? 'development' : __MYISSUE_VERSION__;
